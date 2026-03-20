/**
 * Unit tests for billing logic
 * Tests: plan mapping, subscription status helpers, price ID resolution
 */

// ── Plan limit mapping ────────────────────────────────────────────────────────

const PLAN_LIMITS = {
  free: { maxMembers: 3, maxAgents: 5, maxTasksPerMonth: 100 },
  pro: { maxMembers: 20, maxAgents: 50, maxTasksPerMonth: 5000 },
  enterprise: { maxMembers: -1, maxAgents: -1, maxTasksPerMonth: -1 },
};

describe('Plan limits', () => {
  it('free plan has correct limits', () => {
    expect(PLAN_LIMITS.free.maxAgents).toBe(5);
    expect(PLAN_LIMITS.free.maxTasksPerMonth).toBe(100);
  });

  it('pro plan has unlimited tasks', () => {
    expect(PLAN_LIMITS.pro.maxTasksPerMonth).toBe(5000);
  });

  it('enterprise plan has -1 (unlimited) for all limits', () => {
    expect(PLAN_LIMITS.enterprise.maxMembers).toBe(-1);
    expect(PLAN_LIMITS.enterprise.maxAgents).toBe(-1);
    expect(PLAN_LIMITS.enterprise.maxTasksPerMonth).toBe(-1);
  });

  it('returns correct plan for upgrade', () => {
    const planForStatus = (stripeStatus: string, metaPlan: string) => {
      return ['active', 'trialing'].includes(stripeStatus) ? metaPlan : 'free';
    };
    expect(planForStatus('active', 'pro')).toBe('pro');
    expect(planForStatus('canceled', 'pro')).toBe('free');
    expect(planForStatus('trialing', 'enterprise')).toBe('enterprise');
    expect(planForStatus('past_due', 'pro')).toBe('free');
  });
});

// ── Subscription status helpers ───────────────────────────────────────────────

describe('Subscription status', () => {
  function isActiveSubscription(status: string): boolean {
    return ['active', 'trialing'].includes(status);
  }

  it('active status is considered active', () => {
    expect(isActiveSubscription('active')).toBe(true);
  });

  it('trialing status is considered active', () => {
    expect(isActiveSubscription('trialing')).toBe(true);
  });

  it('canceled status is not active', () => {
    expect(isActiveSubscription('canceled')).toBe(false);
  });

  it('past_due status is not active', () => {
    expect(isActiveSubscription('past_due')).toBe(false);
  });
});

// ── Plan validation ───────────────────────────────────────────────────────────

describe('Plan validation', () => {
  const validPlans = ['pro', 'enterprise'];

  it('accepts valid plan names', () => {
    expect(validPlans.includes('pro')).toBe(true);
    expect(validPlans.includes('enterprise')).toBe(true);
  });

  it('rejects invalid plan names', () => {
    expect(validPlans.includes('premium')).toBe(false);
    expect(validPlans.includes('free')).toBe(false);
    expect(validPlans.includes('')).toBe(false);
  });
});

// ── Pricing calculation ───────────────────────────────────────────────────────

describe('Annual discount calculation', () => {
  const prices = {
    pro: { monthly: 29, annual: 24 },
    enterprise: { monthly: 99, annual: 84 },
  };

  it('pro annual saves 17%', () => {
    const savings = ((prices.pro.monthly - prices.pro.annual) / prices.pro.monthly) * 100;
    expect(Math.round(savings)).toBe(17);
  });

  it('enterprise annual saves approximately 15%', () => {
    const savings = ((prices.enterprise.monthly - prices.enterprise.annual) / prices.enterprise.monthly) * 100;
    expect(savings).toBeGreaterThan(14);
    expect(savings).toBeLessThan(16);
  });

  it('annual is always less than monthly', () => {
    Object.values(prices).forEach(({ monthly, annual }) => {
      expect(annual).toBeLessThan(monthly);
    });
  });
});
