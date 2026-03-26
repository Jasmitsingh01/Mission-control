import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Zap, Building2, X, ChevronDown, ChevronUp, Loader2, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { billingApi } from '@/lib/api'

const plans = [
  {
    name: 'Starter',
    price: '$0',
    priceAnnual: '$0',
    period: 'Free forever',
    desc: 'Perfect for individuals exploring AI agent orchestration.',
    icon: ArrowRight,
    popular: false,
    features: [
      'Up to 3 AI agents',
      '50 tasks per month',
      'Basic activity feed',
      'Community support',
      '1 workspace',
      '5 scheduled jobs',
    ],
  },
  {
    name: 'Pro',
    price: '$29',
    priceAnnual: '$24',
    period: '/mo',
    desc: 'For developers and small teams shipping with AI agents.',
    icon: Zap,
    popular: true,
    features: [
      'Unlimited AI agents',
      'Unlimited tasks',
      'Full activity feed with filters',
      'Priority support',
      '5 workspaces',
      'Unlimited scheduled jobs',
      'Memory browser',
      'Skill marketplace',
      'Mission Launcher',
      'API access',
    ],
  },
  {
    name: 'Enterprise',
    price: '$99',
    priceAnnual: '$84',
    period: '/mo',
    desc: 'For organizations needing advanced security and scale.',
    icon: Building2,
    popular: false,
    features: [
      'Everything in Pro',
      'Unlimited workspaces',
      'SSO / SAML authentication',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantees',
      'On-premise deployment',
      'Audit logs',
      'Advanced RBAC',
      'Custom AI model hosting',
    ],
  },
]

const comparisonGroups = [
  {
    title: 'Core',
    rows: [
      { feature: 'AI Agents', starter: '3', pro: 'Unlimited', enterprise: 'Unlimited' },
      { feature: 'Tasks / month', starter: '50', pro: 'Unlimited', enterprise: 'Unlimited' },
      { feature: 'Workspaces', starter: '1', pro: '5', enterprise: 'Unlimited' },
      { feature: 'Scheduled Jobs', starter: '5', pro: 'Unlimited', enterprise: 'Unlimited' },
    ],
  },
  {
    title: 'Features',
    rows: [
      { feature: 'Activity Feed', starter: 'Basic', pro: 'Advanced', enterprise: 'Advanced' },
      { feature: 'Memory Browser', starter: '--', pro: true, enterprise: true },
      { feature: 'Mission Launcher', starter: '--', pro: true, enterprise: true },
      { feature: 'Skill Marketplace', starter: '--', pro: true, enterprise: true },
      { feature: 'API Access', starter: '--', pro: true, enterprise: true },
    ],
  },
  {
    title: 'Security & Support',
    rows: [
      { feature: 'Support', starter: 'Community', pro: 'Priority', enterprise: 'Dedicated' },
      { feature: 'SSO / SAML', starter: '--', pro: '--', enterprise: true },
      { feature: 'Audit Logs', starter: '--', pro: '--', enterprise: true },
      { feature: 'On-premise', starter: '--', pro: '--', enterprise: true },
      { feature: 'SLA', starter: '--', pro: '--', enterprise: 'Custom' },
    ],
  },
]

const faqs = [
  { q: 'Can I self-host AgentForge?', a: 'Yes! AgentForge is fully open-source and can be deployed on your own infrastructure using Docker.' },
  { q: 'What AI models are supported?', a: 'We support Anthropic Claude, OpenAI GPT, Google Gemini, and any model available through OpenRouter.' },
  { q: 'Is my data secure?', a: 'When self-hosted, your data never leaves your infrastructure. Our cloud version uses encryption at rest and in transit.' },
  { q: 'Can I change plans later?', a: 'Absolutely. You can upgrade or downgrade at any time. Changes take effect immediately with prorated billing.' },
  { q: 'Do you offer refunds?', a: 'Yes, we offer a 14-day money-back guarantee on all paid plans. No questions asked.' },
  { q: 'What happens when I hit my limits?', a: 'On the Starter plan, you will receive a notification and can upgrade anytime. We never hard-block your agents mid-task.' },
]

export function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [_, setBillingError] = useState('')
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  async function handlePlanSelect(planName: string) {
    if (planName === 'Starter') {
      navigate('/signup')
      return
    }
    if (planName === 'Enterprise') {
      navigate('/contact')
      return
    }

    if (!user) {
      navigate('/signup')
      return
    }

    const plan = planName.toLowerCase() as 'pro' | 'enterprise'
    const interval = annual ? 'annual' : 'monthly'
    setCheckoutLoading(plan)
    setBillingError('')
    try {
      const { url, configured } = await billingApi.createCheckout(plan, interval)
      if (configured === false) {
        setBillingError('Stripe is not configured yet. Contact the administrator.')
        return
      }
      if (url) window.location.href = url
    } catch (e: any) {
      setBillingError(e.message || 'Failed to create checkout session.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  return (
    <div className="pt-24 pb-16 bg-surface-dim">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 text-center py-16">
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-on-surface">
          Simple Pricing. <span className="text-primary">Powerful Agents.</span>
        </h1>
        <p className="mt-6 text-base text-on-surface-variant max-w-xl mx-auto">
          Start free, scale as you grow. No hidden fees, no surprises.
        </p>

        {/* Monthly/Annual toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${!annual ? 'text-on-surface' : 'text-outline'}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-14 h-7 rounded-full transition-colors ${annual ? 'bg-primary' : 'bg-surface-container-high'}`}
          >
            <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${annual ? 'translate-x-7.5' : 'translate-x-0.5'}`} />
          </button>
          <span className={`text-sm font-medium ${annual ? 'text-on-surface' : 'text-outline'}`}>Annual</span>
          {annual && <span className="text-xs font-medium text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">Save 17%</span>}
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name}>
              <div className={`h-full relative rounded-xl border p-8 ${
                plan.popular
                  ? 'border-primary bg-card shadow-sm'
                  : 'border-outline-variant/30 bg-card'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-on-primary text-xs font-semibold px-4 py-1 rounded-full">Most Popular</span>
                  </div>
                )}
                <div className="inline-flex rounded-lg bg-surface-container p-2.5 mb-4">
                  <plan.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-on-surface">{plan.name}</h3>
                <div className="mt-3 mb-3">
                  <span className="text-3xl font-bold text-on-surface font-mono">
                    {annual ? plan.priceAnnual : plan.price}
                  </span>
                  <span className="text-on-surface-variant text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-on-surface-variant mb-6">{plan.desc}</p>

                <button
                  onClick={() => handlePlanSelect(plan.name)}
                  disabled={checkoutLoading === plan.name.toLowerCase()}
                  className={`w-full py-3 rounded-lg text-sm font-semibold mb-6 transition-colors disabled:opacity-50 ${
                    plan.popular
                      ? 'bg-primary text-on-primary hover:bg-primary/90'
                      : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {checkoutLoading === plan.name.toLowerCase() ? (
                    <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Processing…</span>
                  ) : plan.name === 'Enterprise' ? 'Contact Sales' : plan.name === 'Starter' ? 'Get Started Free' : (
                    user ? `Subscribe to ${plan.name}` : 'Get Started'
                  )}
                </button>

                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                      <span className="text-on-surface-variant">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="max-w-5xl mx-auto px-6 lg:px-8 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">Feature Comparison</h2>
        </div>

        <div className="bg-card rounded-xl border border-outline-variant/30 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-outline-variant/20 bg-surface-container">
            <div className="text-sm font-semibold text-on-surface">Feature</div>
            <div className="text-sm font-semibold text-on-surface text-center">Starter</div>
            <div className="text-sm font-semibold text-primary text-center">Pro</div>
            <div className="text-sm font-semibold text-on-surface text-center">Enterprise</div>
          </div>

          {comparisonGroups.map((group) => (
            <div key={group.title}>
              <div className="px-6 py-3 bg-surface-container-lowest border-b border-outline-variant/20">
                <span className="text-xs font-mono text-secondary uppercase tracking-wider">{group.title}</span>
              </div>
              {group.rows.map((row) => (
                <div key={row.feature} className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-outline-variant/10">
                  <div className="text-sm text-on-surface-variant">{row.feature}</div>
                  {[row.starter, row.pro, row.enterprise].map((val, idx) => (
                    <div key={idx} className="text-sm text-center">
                      {val === true ? (
                        <CheckCircle2 className="h-4 w-4 text-secondary mx-auto" />
                      ) : val === '--' ? (
                        <X className="h-4 w-4 text-outline/40 mx-auto" />
                      ) : (
                        <span className="text-on-surface-variant font-mono text-xs">{val as string}</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 lg:px-8 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">Frequently Asked Questions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, i) => (
            <div key={faq.q}>
              <div
                className="bg-card rounded-xl border border-outline-variant/30 p-5 cursor-pointer hover:border-primary/20 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-sm text-on-surface">{faq.q}</h3>
                  {openFaq === i ? (
                    <ChevronUp className="h-4 w-4 text-outline shrink-0 mt-0.5" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-outline shrink-0 mt-0.5" />
                  )}
                </div>
                {openFaq === i && (
                  <p className="text-sm text-on-surface-variant leading-relaxed mt-3">
                    {faq.a}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="bg-primary rounded-xl p-12 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Start building with AgentForge today
          </h2>
          <p className="mt-4 text-white/80 max-w-lg mx-auto text-sm">
            No credit card required. Deploy your first agent team in under 2 minutes.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <button className="bg-white text-primary px-8 py-3 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors flex items-center gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link to="/contact">
              <button className="border border-white/30 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-card/10 transition-colors">
                Talk to Sales
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
