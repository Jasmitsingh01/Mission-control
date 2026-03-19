import { Request, Response, NextFunction } from 'express';
import OrgMember, { OrgRole, ROLE_HIERARCHY } from '../models/OrgMember';

/**
 * Require that the authenticated user has at least `minRole` in the org
 * specified by req.orgId (set by authenticate middleware via X-Org-Id header).
 */
export function requireRole(...allowedRoles: OrgRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.orgId) {
        res.status(400).json({ error: 'Organization context required. Set X-Org-Id header.' });
        return;
      }

      if (!req.orgRole) {
        res.status(403).json({ error: 'You are not a member of this organization.' });
        return;
      }

      if (!allowedRoles.includes(req.orgRole)) {
        res.status(403).json({
          error: `Insufficient permissions. Required: ${allowedRoles.join(' or ')}. Your role: ${req.orgRole}.`,
        });
        return;
      }

      next();
    } catch (err) {
      console.error('RBAC middleware error:', err);
      res.status(500).json({ error: 'Authorization check failed.' });
    }
  };
}

/**
 * Require at least a minimum role level (uses hierarchy).
 * e.g., requireMinRole('member') allows member, admin, owner
 */
export function requireMinRole(minRole: OrgRole) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.orgId) {
        res.status(400).json({ error: 'Organization context required. Set X-Org-Id header.' });
        return;
      }

      if (!req.orgRole) {
        res.status(403).json({ error: 'You are not a member of this organization.' });
        return;
      }

      const userLevel = ROLE_HIERARCHY[req.orgRole] || 0;
      const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

      if (userLevel < requiredLevel) {
        res.status(403).json({
          error: `Insufficient permissions. Minimum role required: ${minRole}. Your role: ${req.orgRole}.`,
        });
        return;
      }

      next();
    } catch (err) {
      console.error('RBAC middleware error:', err);
      res.status(500).json({ error: 'Authorization check failed.' });
    }
  };
}

/**
 * Lightweight org membership check — just ensures user belongs to the org.
 * No specific role requirement.
 */
export function requireOrgMembership() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.orgId) {
      res.status(400).json({ error: 'Organization context required. Set X-Org-Id header.' });
      return;
    }
    if (!req.orgRole) {
      res.status(403).json({ error: 'You are not a member of this organization.' });
      return;
    }
    next();
  };
}
