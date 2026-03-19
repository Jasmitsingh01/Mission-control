import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import OrgMember from '../models/OrgMember';
import type { OrgRole } from '../models/OrgMember';

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      orgId?: string;
      orgRole?: OrgRole;
    }
  }
}

interface JwtPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'agentforge_jwt_secret_change_in_production';

// In-memory cache for org membership lookups (TTL: 60s)
const membershipCache = new Map<string, { role: OrgRole; expiresAt: number }>();
const CACHE_TTL = 60_000;

function getCachedRole(userId: string, orgId: string): OrgRole | null {
  const key = `${userId}:${orgId}`;
  const entry = membershipCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    membershipCache.delete(key);
    return null;
  }
  return entry.role;
}

function setCachedRole(userId: string, orgId: string, role: OrgRole): void {
  const key = `${userId}:${orgId}`;
  membershipCache.set(key, { role, expiresAt: Date.now() + CACHE_TTL });
  // Evict old entries periodically
  if (membershipCache.size > 10_000) {
    const now = Date.now();
    for (const [k, v] of membershipCache) {
      if (now > v.expiresAt) membershipCache.delete(k);
    }
  }
}

export function invalidateMembershipCache(userId: string, orgId: string): void {
  membershipCache.delete(`${userId}:${orgId}`);
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    req.userId = decoded.id;
    req.userEmail = decoded.email;

    // Resolve org context from header (fast path with cache)
    const orgId = req.headers['x-org-id'] as string | undefined;
    if (orgId) {
      req.orgId = orgId;

      const cached = getCachedRole(decoded.id, orgId);
      if (cached) {
        req.orgRole = cached;
      } else {
        const membership = await OrgMember.findOne(
          { orgId, userId: decoded.id },
          { role: 1 }
        ).lean();
        if (membership) {
          req.orgRole = membership.role;
          setCachedRole(decoded.id, orgId, membership.role);
        }
        // If no membership found, orgRole stays undefined — RBAC middleware will reject
      }
    }

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired. Please log in again.' });
      return;
    }
    if (err.name === 'JsonWebTokenError') {
      res.status(401).json({ error: 'Invalid token.' });
      return;
    }
    res.status(500).json({ error: 'Authentication failed.' });
  }
};
