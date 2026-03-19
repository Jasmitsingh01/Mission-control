import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Organization from '../models/Organization';
import OrgMember from '../models/OrgMember';
import { authenticate } from '../middleware/auth';
import { PLAN_LIMITS } from '../models/Organization';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'agentforge_jwt_secret_change_in_production';
const TOKEN_EXPIRY = '7d';

function generateToken(user: { _id: any; email: string }): string {
  return jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

/** Fetch orgs the user belongs to (lightweight, for auth responses) */
async function getUserOrgs(userId: string) {
  const memberships = await OrgMember.find({ userId }).lean();
  if (memberships.length === 0) return [];
  const orgIds = memberships.map((m) => m.orgId);
  const orgs = await Organization.find({ _id: { $in: orgIds } }, 'name slug plan').lean();
  const roleMap = new Map(memberships.map((m) => [m.orgId.toString(), m.role]));
  return orgs.map((o) => ({
    id: o._id,
    name: o.name,
    slug: o.slug,
    plan: o.plan,
    role: roleMap.get(o._id.toString()),
  }));
}

// POST /register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ error: 'Email already registered.' });
      return;
    }

    const user = new User({ name, email, password });
    await user.save();

    // Auto-create a personal organization for the new user
    const slug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50);
    const uniqueSlug = `${slug}-${Date.now().toString(36)}`;
    const org = new Organization({
      name: `${name}'s Workspace`,
      slug: uniqueSlug,
      ownerId: user._id,
      plan: 'free',
      settings: { ...PLAN_LIMITS.free },
    });
    await org.save();

    const member = new OrgMember({
      orgId: org._id,
      userId: user._id,
      role: 'owner',
      invitedBy: user._id,
    });
    await member.save();

    // Set as current org
    user.currentOrgId = org._id.toString();
    await user.save();

    const token = generateToken(user);
    const orgs = await getUserOrgs(user._id.toString());

    res.status(201).json({
      token,
      user: user.toJSON(),
      orgs,
      currentOrgId: org._id.toString(),
    });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// POST /login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user);
    const orgs = await getUserOrgs(user._id.toString());

    res.json({
      token,
      user: user.toJSON(),
      orgs,
      currentOrgId: user.currentOrgId || (orgs[0]?.id?.toString() ?? null),
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// GET /me (protected)
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const orgs = await getUserOrgs(user._id.toString());

    res.json({
      user: user.toJSON(),
      orgs,
      currentOrgId: user.currentOrgId || (orgs[0]?.id?.toString() ?? null),
    });
  } catch (err: any) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// PUT /me (protected) - update profile/settings
router.put('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, currentOrgId, settings } = req.body;

    const updateFields: Record<string, any> = {};

    if (name !== undefined) updateFields.name = name;
    if (currentOrgId !== undefined) {
      // Verify user is a member of the org they're switching to
      const membership = await OrgMember.findOne({ orgId: currentOrgId, userId: req.userId }).lean();
      if (!membership) {
        res.status(403).json({ error: 'Not a member of this organization.' });
        return;
      }
      updateFields.currentOrgId = currentOrgId;
    }

    if (settings) {
      if (settings.preferredModel !== undefined) {
        updateFields['settings.preferredModel'] = settings.preferredModel;
      }
      if (settings.maxTokens !== undefined) {
        updateFields['settings.maxTokens'] = settings.maxTokens;
      }
      if (settings.temperature !== undefined) {
        updateFields['settings.temperature'] = settings.temperature;
      }
    }

    const user = await User.findByIdAndUpdate(req.userId, { $set: updateFields }, { new: true });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({ user: user.toJSON() });
  } catch (err: any) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// PUT /me/api-key (protected) - update OpenRouter API key
router.put('/me/api-key', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { apiKey } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { 'settings.openrouterApiKey': apiKey || '' } },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({ user: user.toJSON(), message: 'API key updated successfully.' });
  } catch (err: any) {
    console.error('Update API key error:', err);
    res.status(500).json({ error: 'Failed to update API key.' });
  }
});

export default router;
