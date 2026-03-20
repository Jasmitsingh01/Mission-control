/**
 * Admin Panel API Routes
 * Requires: authenticated user with isAdmin flag in JWT or DB
 * All routes: GET /api/admin/...
 */
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import User from '../models/User';
import Organization from '../models/Organization';
import OrgMember from '../models/OrgMember';
import Subscription from '../models/Subscription';
import MissionHistory from '../models/MissionHistory';

const router = Router();

// Admin email list — set ADMIN_EMAILS="a@b.com,c@d.com" in env
function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// Admin guard middleware
async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const admins = getAdminEmails();
  if (!req.userEmail || !admins.includes(req.userEmail.toLowerCase())) {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  next();
}

router.use(authenticate, requireAdmin);

// ── Stats overview ────────────────────────────────────────────────────────────

router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalOrgs,
      proOrgs,
      enterpriseOrgs,
      totalMissions,
    ] = await Promise.all([
      User.countDocuments(),
      Organization.countDocuments(),
      Organization.countDocuments({ plan: 'pro' }),
      Organization.countDocuments({ plan: 'enterprise' }),
      MissionHistory.countDocuments().catch(() => 0),
    ]);

    // New users in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsers30d = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    res.json({
      users: { total: totalUsers, new30d: newUsers30d },
      orgs: { total: totalOrgs, pro: proOrgs, enterprise: enterpriseOrgs, free: totalOrgs - proOrgs - enterpriseOrgs },
      missions: { total: totalMissions },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// ── Users ─────────────────────────────────────────────────────────────────────

router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const search = (req.query.search as string) || '';
    const planFilter = req.query.plan as string;

    const query: Record<string, any> = {};
    if (search) {
      const re = new RegExp(search, 'i');
      query.$or = [{ name: re }, { email: re }];
    }
    if (planFilter && ['free', 'pro', 'enterprise'].includes(planFilter)) {
      query.plan = planFilter;
    }

    const [users, total] = await Promise.all([
      User.find(query, '-password')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({ users, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

router.get('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id, '-password').lean();
    if (!user) { res.status(404).json({ error: 'User not found.' }); return; }

    const [orgs, missionCount] = await Promise.all([
      OrgMember.find({ userId: user._id }).lean().then(async (memberships) => {
        const orgIds = memberships.map((m) => m.orgId);
        return Organization.find({ _id: { $in: orgIds } }, 'name slug plan').lean();
      }),
      MissionHistory.countDocuments({ userId: user._id }).catch(() => 0),
    ]);

    res.json({ user, orgs, missionCount });
  } catch (err) {
    console.error('Admin user detail error:', err);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// PATCH /admin/users/:id - update user plan/status
router.patch('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { plan } = req.body;
    const allowed: Record<string, any> = {};

    if (plan && ['free', 'pro', 'enterprise'].includes(plan)) {
      allowed.plan = plan;
    }

    if (Object.keys(allowed).length === 0) {
      res.status(400).json({ error: 'No valid fields to update.' });
      return;
    }

    const user = await User.findByIdAndUpdate(req.params.id, allowed, { new: true }).select('-password');
    if (!user) { res.status(404).json({ error: 'User not found.' }); return; }

    res.json({ user });
  } catch (err) {
    console.error('Admin patch user error:', err);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// DELETE /admin/users/:id - soft-delete (remove from all orgs)
router.delete('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404).json({ error: 'User not found.' }); return; }

    // Remove from all orgs
    await OrgMember.deleteMany({ userId: req.params.id });

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// ── Organizations ─────────────────────────────────────────────────────────────

router.get('/orgs', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const search = (req.query.search as string) || '';

    const query: Record<string, any> = {};
    if (search) {
      const re = new RegExp(search, 'i');
      query.$or = [{ name: re }, { slug: re }];
    }

    const [orgs, total] = await Promise.all([
      Organization.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Organization.countDocuments(query),
    ]);

    // Enrich with member counts
    const enriched = await Promise.all(
      orgs.map(async (org) => {
        const memberCount = await OrgMember.countDocuments({ orgId: org._id });
        return { ...org, memberCount };
      })
    );

    res.json({ orgs: enriched, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Admin orgs error:', err);
    res.status(500).json({ error: 'Failed to fetch orgs.' });
  }
});

// PATCH /admin/orgs/:id - update org plan
router.patch('/orgs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { plan } = req.body;
    if (!plan || !['free', 'pro', 'enterprise'].includes(plan)) {
      res.status(400).json({ error: 'Invalid plan.' });
      return;
    }
    const org = await Organization.findByIdAndUpdate(req.params.id, { plan }, { new: true }).lean();
    if (!org) { res.status(404).json({ error: 'Org not found.' }); return; }
    res.json({ org });
  } catch (err) {
    console.error('Admin patch org error:', err);
    res.status(500).json({ error: 'Failed to update org.' });
  }
});

export default router;
