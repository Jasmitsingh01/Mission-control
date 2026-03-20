/**
 * Unit tests for RBAC (Role-Based Access Control) logic
 */

// Mirror of ROLE_HIERARCHY from OrgMember model
const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

function hasMinRole(userRole: string, minRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
  return userLevel >= requiredLevel;
}

function hasRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

describe('Role hierarchy', () => {
  it('owner has highest rank', () => {
    expect(ROLE_HIERARCHY.owner).toBeGreaterThan(ROLE_HIERARCHY.admin);
    expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.member);
    expect(ROLE_HIERARCHY.member).toBeGreaterThan(ROLE_HIERARCHY.viewer);
  });

  it('viewer has lowest rank', () => {
    expect(ROLE_HIERARCHY.viewer).toBe(1);
  });
});

describe('requireMinRole', () => {
  it('owner satisfies any minimum role', () => {
    expect(hasMinRole('owner', 'viewer')).toBe(true);
    expect(hasMinRole('owner', 'member')).toBe(true);
    expect(hasMinRole('owner', 'admin')).toBe(true);
    expect(hasMinRole('owner', 'owner')).toBe(true);
  });

  it('viewer fails admin requirement', () => {
    expect(hasMinRole('viewer', 'admin')).toBe(false);
  });

  it('member fails admin requirement', () => {
    expect(hasMinRole('member', 'admin')).toBe(false);
  });

  it('admin satisfies member minimum', () => {
    expect(hasMinRole('admin', 'member')).toBe(true);
  });

  it('unknown role fails all requirements', () => {
    expect(hasMinRole('superuser', 'viewer')).toBe(false);
    expect(hasMinRole('', 'viewer')).toBe(false);
  });
});

describe('requireRole (exact match)', () => {
  it('owner matches owner role', () => {
    expect(hasRole('owner', ['owner'])).toBe(true);
  });

  it('admin does not match owner-only', () => {
    expect(hasRole('admin', ['owner'])).toBe(false);
  });

  it('multiple allowed roles work', () => {
    expect(hasRole('admin', ['owner', 'admin'])).toBe(true);
    expect(hasRole('member', ['owner', 'admin'])).toBe(false);
  });
});

describe('Admin email guard', () => {
  const adminEmails = ['admin@agentforge.ai', 'superuser@example.com'];

  function isAdmin(email: string): boolean {
    return adminEmails.includes(email.toLowerCase());
  }

  it('returns true for admin email', () => {
    expect(isAdmin('admin@agentforge.ai')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isAdmin('ADMIN@agentforge.ai')).toBe(true);
  });

  it('returns false for non-admin email', () => {
    expect(isAdmin('user@example.com')).toBe(false);
  });

  it('returns false for empty email', () => {
    expect(isAdmin('')).toBe(false);
  });
});
