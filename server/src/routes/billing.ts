import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { authenticate } from '../middleware/auth';
import Subscription from '../models/Subscription';
import User from '../models/User';
import Organization, { PLAN_LIMITS } from '../models/Organization';

const router = Router();

// Stripe is initialized lazily — requires STRIPE_SECRET_KEY in env
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured.');
  return new Stripe(key, { apiVersion: '2025-06-30.basil' as any });
}

const PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
    annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || 'price_pro_annual',
  },
  enterprise: {
    monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_enterprise_monthly',
    annual: process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || 'price_enterprise_annual',
  },
};

router.use(authenticate);

// GET /billing/status - current subscription info
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) { res.status(404).json({ error: 'User not found.' }); return; }

    const orgId = req.orgId || user.currentOrgId;
    const subscription = orgId
      ? await Subscription.findOne({ orgId }).lean()
      : null;

    const org = orgId ? await Organization.findById(orgId).lean() : null;

    res.json({
      plan: org?.plan || user.plan || 'free',
      subscription: subscription
        ? {
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            trialEnd: subscription.trialEnd,
          }
        : null,
    });
  } catch (err: any) {
    console.error('Billing status error:', err);
    res.status(500).json({ error: 'Failed to fetch billing status.' });
  }
});

// POST /billing/checkout - create Stripe Checkout session
router.post('/checkout', async (req: Request, res: Response): Promise<void> => {
  try {
    const stripe = getStripe();
    const { plan, interval = 'monthly' } = req.body as { plan: 'pro' | 'enterprise'; interval?: 'monthly' | 'annual' };

    if (!plan || !['pro', 'enterprise'].includes(plan)) {
      res.status(400).json({ error: 'Invalid plan. Choose pro or enterprise.' });
      return;
    }

    const user = await User.findById(req.userId).lean();
    if (!user) { res.status(404).json({ error: 'User not found.' }); return; }

    const orgId = req.orgId || user.currentOrgId;
    if (!orgId) { res.status(400).json({ error: 'No organization context.' }); return; }

    // Get or create Stripe customer
    let subscription = await Subscription.findOne({ orgId });
    let customerId: string;

    if (subscription?.stripeCustomerId) {
      customerId = subscription.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: req.userId!, orgId },
      });
      customerId = customer.id;

      if (!subscription) {
        subscription = new Subscription({
          userId: req.userId,
          orgId,
          stripeCustomerId: customerId,
          plan: 'free',
          status: 'free',
          cancelAtPeriodEnd: false,
        });
        await subscription.save();
      } else {
        subscription.stripeCustomerId = customerId;
        await subscription.save();
      }
    }

    const priceId = PRICE_IDS[plan]?.[interval];
    if (!priceId || priceId.startsWith('price_pro') || priceId.startsWith('price_enterprise')) {
      res.status(503).json({
        error: 'Stripe price IDs not configured. Set STRIPE_PRO_MONTHLY_PRICE_ID and related env vars.',
        configured: false,
      });
      return;
    }

    const appUrl = process.env.APP_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/settings?billing=success`,
      cancel_url: `${appUrl}/pricing?billing=canceled`,
      metadata: { userId: req.userId!, orgId, plan },
      subscription_data: {
        metadata: { userId: req.userId!, orgId, plan },
        trial_period_days: 14,
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error('Checkout error:', err);
    if (err.message?.includes('STRIPE_SECRET_KEY')) {
      res.status(503).json({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY to environment.' });
      return;
    }
    res.status(500).json({ error: 'Failed to create checkout session.' });
  }
});

// POST /billing/portal - create Stripe customer portal session
router.post('/portal', async (req: Request, res: Response): Promise<void> => {
  try {
    const stripe = getStripe();
    const user = await User.findById(req.userId).lean();
    if (!user) { res.status(404).json({ error: 'User not found.' }); return; }

    const orgId = req.orgId || user.currentOrgId;
    const subscription = orgId ? await Subscription.findOne({ orgId }).lean() : null;

    if (!subscription?.stripeCustomerId) {
      res.status(404).json({ error: 'No billing account found. Please subscribe first.' });
      return;
    }

    const appUrl = process.env.APP_URL || 'http://localhost:5173';

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${appUrl}/dashboard/settings`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('Portal error:', err);
    if (err.message?.includes('STRIPE_SECRET_KEY')) {
      res.status(503).json({ error: 'Stripe not configured.' });
      return;
    }
    res.status(500).json({ error: 'Failed to create portal session.' });
  }
});

// POST /billing/webhook - Stripe webhook handler (no auth)
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    res.status(503).json({ error: 'Webhook secret not configured.' });
    return;
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'] as string,
      webhookSecret
    );
  } catch (err: any) {
    console.error('Webhook signature error:', err);
    res.status(400).json({ error: 'Invalid webhook signature.' });
    return;
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.orgId;
        const userId = sub.metadata?.userId;
        const plan = (sub.metadata?.plan || 'free') as 'free' | 'pro' | 'enterprise';

        if (orgId) {
          const stripeStatus = sub.status;
          const isActive = ['active', 'trialing'].includes(stripeStatus);

          await Subscription.findOneAndUpdate(
            { orgId },
            {
              stripeSubscriptionId: sub.id,
              stripePriceId: (sub.items.data[0]?.price?.id) || undefined,
              plan: isActive ? plan : 'free',
              status: stripeStatus as any,
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
              trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : undefined,
            },
            { upsert: true, new: true }
          );

          if (isActive) {
            await Organization.findByIdAndUpdate(orgId, {
              plan,
              settings: { ...PLAN_LIMITS[plan] },
            });
            if (userId) {
              await User.findByIdAndUpdate(userId, { plan });
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.orgId;
        const userId = sub.metadata?.userId;

        if (orgId) {
          await Subscription.findOneAndUpdate(
            { orgId },
            { plan: 'free', status: 'canceled', cancelAtPeriodEnd: false }
          );
          await Organization.findByIdAndUpdate(orgId, {
            plan: 'free',
            settings: { ...PLAN_LIMITS.free },
          });
          if (userId) {
            await User.findByIdAndUpdate(userId, { plan: 'free' });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        await Subscription.findOneAndUpdate(
          { stripeCustomerId: customerId },
          { status: 'past_due' }
        );
        break;
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
});

export default router;
