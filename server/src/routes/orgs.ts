import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate, invalidateMembershipCache } from '../middleware/auth';
import { requireMinRole, requireOrgMembership } from '../middleware/rbac';
import Organization, { PLAN_LIMITS } from '../models/Organization';
import OrgMember from '../models/OrgMember';
import Invitation from '../models/Invitation';
import User from '../models/User';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ──────────────────────────────────────────────
// ORG CRUD
// ──────────────────────────────────────────────

// POST / - Create organization
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      res.status(400).json({ error: 'Name and slug are required.' });
      return;
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      res.status(400).json({ error: 'Slug must contain only lowercase letters, numbers, and hyphens.' });
      return;
    }

    const existing = await Organization.findOne({ slug }).lean();
    if (existing) {
      res.status(409).json({ error: 'An organization with this slug already exists.' });
      return;
    }

    // Limit: free users can own max 3 orgs
    const ownedCount = await Organization.countDocuments({ ownerId: req.userId });
    if (ownedCount >= 10) {
      res.status(403).json({ error: 'Maximum organization limit reached.' });
      return;
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const org = new Organization({
        name,
        slug,
        ownerId: req.userId,
        plan: 'free',
        settings: { ...PLAN_LIMITS.free },
      });
      await org.save({ session });

      // Auto-add creator as owner member
      const member = new OrgMember({
        orgId: org._id,
        userId: req.userId,
        role: 'owner',
        invitedBy: req.userId,
      });
      await member.save({ session });

      // Set as user's current org if they don't have one
      await User.findByIdAndUpdate(
        req.userId,
        { $setOnInsert: { currentOrgId: org._id.toString() } },
        { session }
      );

      await session.commitTransaction();

      res.status(201).json({
        org: org.toObject(),
        membership: member.toObject(),
      });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err: any) {
    console.error('Create org error:', err);
    res.status(500).json({ error: 'Failed to create organization.' });
  }
});

// GET / - List user's organizations
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const memberships = await OrgMember.find({ userId: req.userId }).lean();
    const orgIds = memberships.map((m) => m.orgId);

    const orgs = await Organization.find({ _id: { $in: orgIds } })
      .sort({ createdAt: -1 })
      .lean();

    // Attach role and member counts
    const memberCounts = await OrgMember.aggregate([
      { $match: { orgId: { $in: orgIds } } },
      { $group: { _id: '$orgId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(memberCounts.map((c) => [c._id.toString(), c.count]));
    const roleMap = new Map(memberships.map((m) => [m.orgId.toString(), m.role]));

    const result = orgs.map((org) => ({
      ...org,
      memberCount: countMap.get(org._id.toString()) || 0,
      userRole: roleMap.get(org._id.toString()) || 'viewer',
    }));

    res.json({ orgs: result });
  } catch (err: any) {
    console.error('List orgs error:', err);
    res.status(500).json({ error: 'Failed to fetch organizations.' });
  }
});

// GET /:orgId - Get org details (requires membership)
router.get('/:orgId', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.params.orgId as string;

    // Verify membership
    const membership = await OrgMember.findOne({ orgId, userId: req.userId }).lean();
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this organization.' });
      return;
    }

    const org = await Organization.findById(orgId).lean();
    if (!org) {
      res.status(404).json({ error: 'Organization not found.' });
      return;
    }

    const memberCount = await OrgMember.countDocuments({ orgId });

    res.json({
      org: { ...org, memberCount },
      userRole: membership.role,
    });
  } catch (err: any) {
    console.error('Get org error:', err);
    res.status(500).json({ error: 'Failed to fetch organization.' });
  }
});

// PUT /:orgId - Update org (admin+ only)
router.put('/:orgId', requireMinRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug } = req.body;
    const updateFields: Record<string, any> = {};

    if (name !== undefined) updateFields.name = name;
    if (slug !== undefined) {
      if (!/^[a-z0-9-]+$/.test(slug)) {
        res.status(400).json({ error: 'Invalid slug format.' });
        return;
      }
      const existing = await Organization.findOne({ slug, _id: { $ne: req.params.orgId as string } }).lean();
      if (existing) {
        res.status(409).json({ error: 'Slug already taken.' });
        return;
      }
      updateFields.slug = slug;
    }

    const org = await Organization.findByIdAndUpdate(
      req.params.orgId,
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!org) {
      res.status(404).json({ error: 'Organization not found.' });
      return;
    }

    res.json({ org });
  } catch (err: any) {
    console.error('Update org error:', err);
    res.status(500).json({ error: 'Failed to update organization.' });
  }
});

// DELETE /:orgId - Delete org (owner only)
router.delete('/:orgId', requireMinRole('owner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.params.orgId as string;

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      await Organization.findByIdAndDelete(orgId, { session });
      await OrgMember.deleteMany({ orgId }, { session });
      await Invitation.deleteMany({ orgId }, { session });

      await session.commitTransaction();
      res.json({ message: 'Organization deleted successfully.' });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err: any) {
    console.error('Delete org error:', err);
    res.status(500).json({ error: 'Failed to delete organization.' });
  }
});

// ──────────────────────────────────────────────
// MEMBER MANAGEMENT
// ──────────────────────────────────────────────

// GET /:orgId/members - List members
router.get('/:orgId/members', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.params.orgId as string;

    // Verify membership
    const membership = await OrgMember.findOne({ orgId, userId: req.userId }).lean();
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this organization.' });
      return;
    }

    const members = await OrgMember.find({ orgId })
      .populate('userId', 'name email avatar')
      .sort({ role: 1, joinedAt: 1 })
      .lean();

    const result = members.map((m) => {
      const user = m.userId as any;
      return {
        id: m._id,
        memberId: m._id,
        userId: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: m.role,
        joinedAt: m.joinedAt,
      };
    });

    res.json({ members: result });
  } catch (err: any) {
    console.error('List members error:', err);
    res.status(500).json({ error: 'Failed to fetch members.' });
  }
});

// PUT /:orgId/members/:memberId/role - Update member role (admin+ only)
router.put('/:orgId/members/:memberId/role', requireMinRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.params.orgId as string;
    const memberId = req.params.memberId as string;
    const { role } = req.body;

    if (!['admin', 'member', 'viewer'].includes(role)) {
      res.status(400).json({ error: 'Invalid role. Must be admin, member, or viewer.' });
      return;
    }

    const targetMember = await OrgMember.findOne({ _id: memberId, orgId });
    if (!targetMember) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    // Can't change owner's role
    if (targetMember.role === 'owner') {
      res.status(403).json({ error: 'Cannot change the owner\'s role.' });
      return;
    }

    // Admins can't promote to admin (only owners can)
    if (role === 'admin' && req.orgRole !== 'owner') {
      res.status(403).json({ error: 'Only the owner can promote members to admin.' });
      return;
    }

    targetMember.role = role;
    await targetMember.save();

    invalidateMembershipCache(targetMember.userId.toString(), orgId);

    res.json({ member: targetMember.toObject() });
  } catch (err: any) {
    console.error('Update member role error:', err);
    res.status(500).json({ error: 'Failed to update member role.' });
  }
});

// DELETE /:orgId/members/:memberId - Remove member (admin+ or self)
router.delete('/:orgId/members/:memberId', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.params.orgId as string;
    const memberId = req.params.memberId as string;

    // Verify caller is admin+ or removing self
    const callerMembership = await OrgMember.findOne({ orgId, userId: req.userId }).lean();
    if (!callerMembership) {
      res.status(403).json({ error: 'Not a member of this organization.' });
      return;
    }

    const targetMember = await OrgMember.findOne({ _id: memberId, orgId });
    if (!targetMember) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    // Owner can't be removed
    if (targetMember.role === 'owner') {
      res.status(403).json({ error: 'Cannot remove the organization owner.' });
      return;
    }

    const isSelf = targetMember.userId.toString() === req.userId;
    const isAdminPlus = callerMembership.role === 'owner' || callerMembership.role === 'admin';

    if (!isSelf && !isAdminPlus) {
      res.status(403).json({ error: 'Insufficient permissions to remove this member.' });
      return;
    }

    await targetMember.deleteOne();
    invalidateMembershipCache(targetMember.userId.toString(), orgId);

    res.json({ message: 'Member removed successfully.' });
  } catch (err: any) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Failed to remove member.' });
  }
});

// ──────────────────────────────────────────────
// INVITATIONS
// ──────────────────────────────────────────────

// POST /:orgId/invitations - Send invitation (admin+ only)
router.post('/:orgId/invitations', requireMinRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.params.orgId as string;
    const { email, role } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    if (role && !['admin', 'member', 'viewer'].includes(role)) {
      res.status(400).json({ error: 'Invalid role.' });
      return;
    }

    // Only owners can invite admins
    if (role === 'admin' && req.orgRole !== 'owner') {
      res.status(403).json({ error: 'Only the owner can invite admins.' });
      return;
    }

    // Check if user is already a member
    const existingUser = await User.findOne({ email: email.toLowerCase() }).lean();
    if (existingUser) {
      const existingMember = await OrgMember.findOne({
        orgId,
        userId: existingUser._id,
      }).lean();
      if (existingMember) {
        res.status(409).json({ error: 'User is already a member of this organization.' });
        return;
      }
    }

    // Check for existing pending invitation
    const existingInvite = await Invitation.findOne({
      orgId,
      email: email.toLowerCase(),
      status: 'pending',
    }).lean();
    if (existingInvite) {
      res.status(409).json({ error: 'An invitation has already been sent to this email.' });
      return;
    }

    // Check org member limit
    const org = await Organization.findById(orgId).lean();
    if (!org) {
      res.status(404).json({ error: 'Organization not found.' });
      return;
    }
    if (org.settings.maxMembers > 0) {
      const currentCount = await OrgMember.countDocuments({ orgId });
      if (currentCount >= org.settings.maxMembers) {
        res.status(403).json({ error: `Organization member limit reached (${org.settings.maxMembers}). Upgrade your plan.` });
        return;
      }
    }

    const invitation = new Invitation({
      orgId,
      email: email.toLowerCase(),
      role: role || 'member',
      invitedBy: req.userId,
    });
    await invitation.save();

    res.status(201).json({ invitation: invitation.toObject() });
  } catch (err: any) {
    console.error('Create invitation error:', err);
    res.status(500).json({ error: 'Failed to send invitation.' });
  }
});

// GET /:orgId/invitations - List pending invitations (admin+ only)
router.get('/:orgId/invitations', requireMinRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const invitations = await Invitation.find({
      orgId: req.params.orgId,
      status: 'pending',
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ invitations });
  } catch (err: any) {
    console.error('List invitations error:', err);
    res.status(500).json({ error: 'Failed to fetch invitations.' });
  }
});

// POST /invitations/:token/accept - Accept invitation (any authenticated user)
router.post('/invitations/:token/accept', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token, status: 'pending' });
    if (!invitation) {
      res.status(404).json({ error: 'Invitation not found or already used.' });
      return;
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      res.status(410).json({ error: 'Invitation has expired.' });
      return;
    }

    // Verify email matches (or allow any authenticated user if desired)
    if (req.userEmail?.toLowerCase() !== invitation.email) {
      res.status(403).json({ error: 'This invitation was sent to a different email address.' });
      return;
    }

    // Check if already a member
    const existing = await OrgMember.findOne({
      orgId: invitation.orgId,
      userId: req.userId,
    }).lean();
    if (existing) {
      invitation.status = 'accepted';
      await invitation.save();
      res.json({ message: 'You are already a member of this organization.' });
      return;
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const member = new OrgMember({
        orgId: invitation.orgId,
        userId: req.userId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
      });
      await member.save({ session });

      invitation.status = 'accepted';
      await invitation.save({ session });

      await session.commitTransaction();

      const org = await Organization.findById(invitation.orgId).lean();

      res.json({
        message: 'Invitation accepted.',
        org,
        membership: member.toObject(),
      });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err: any) {
    console.error('Accept invitation error:', err);
    res.status(500).json({ error: 'Failed to accept invitation.' });
  }
});

// DELETE /:orgId/invitations/:invitationId - Revoke invitation (admin+ only)
router.delete('/:orgId/invitations/:invitationId', requireMinRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const invitation = await Invitation.findOneAndUpdate(
      { _id: req.params.invitationId, orgId: req.params.orgId, status: 'pending' },
      { status: 'revoked' },
      { new: true }
    );

    if (!invitation) {
      res.status(404).json({ error: 'Invitation not found.' });
      return;
    }

    res.json({ message: 'Invitation revoked.' });
  } catch (err: any) {
    console.error('Revoke invitation error:', err);
    res.status(500).json({ error: 'Failed to revoke invitation.' });
  }
});

// ──────────────────────────────────────────────
// TRANSFER OWNERSHIP
// ──────────────────────────────────────────────

// POST /:orgId/transfer - Transfer ownership (owner only)
router.post('/:orgId/transfer', requireMinRole('owner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.params.orgId as string;
    const { newOwnerId } = req.body;

    if (!newOwnerId) {
      res.status(400).json({ error: 'New owner ID is required.' });
      return;
    }

    const newOwnerMembership = await OrgMember.findOne({ orgId, userId: newOwnerId });
    if (!newOwnerMembership) {
      res.status(404).json({ error: 'Target user is not a member of this organization.' });
      return;
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Demote current owner to admin
      await OrgMember.findOneAndUpdate(
        { orgId, userId: req.userId },
        { role: 'admin' },
        { session }
      );

      // Promote new owner
      newOwnerMembership.role = 'owner';
      await newOwnerMembership.save({ session });

      // Update org ownerId
      await Organization.findByIdAndUpdate(orgId, { ownerId: newOwnerId }, { session });

      await session.commitTransaction();

      invalidateMembershipCache(req.userId!, orgId);
      invalidateMembershipCache(newOwnerId, orgId);

      res.json({ message: 'Ownership transferred successfully.' });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err: any) {
    console.error('Transfer ownership error:', err);
    res.status(500).json({ error: 'Failed to transfer ownership.' });
  }
});

export default router;
