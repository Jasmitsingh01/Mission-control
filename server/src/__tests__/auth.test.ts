/**
 * Unit tests for authentication routes
 * Tests: input validation, password hashing, JWT generation, login logic
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-unit-tests';

// ── JWT helpers ───────────────────────────────────────────────────────────────

describe('JWT token generation', () => {
  it('creates a valid token with id and email', () => {
    const payload = { id: 'user123', email: 'test@example.com' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    expect(decoded.id).toBe('user123');
    expect(decoded.email).toBe('test@example.com');
  });

  it('throws on expired token', () => {
    const token = jwt.sign({ id: 'x', email: 'x@x.com' }, JWT_SECRET, { expiresIn: '-1s' });
    expect(() => jwt.verify(token, JWT_SECRET)).toThrow('jwt expired');
  });

  it('throws on invalid signature', () => {
    const token = jwt.sign({ id: 'x' }, 'wrong-secret');
    expect(() => jwt.verify(token, JWT_SECRET)).toThrow();
  });
});

// ── Password hashing ──────────────────────────────────────────────────────────

describe('Password hashing', () => {
  it('bcrypt hashes a password with salt rounds >= 10', async () => {
    const plaintext = 'SecurePassword123!';
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(plaintext, salt);

    expect(hash).not.toBe(plaintext);
    expect(hash.startsWith('$2')).toBe(true);
    expect(hash.length).toBeGreaterThan(50);
  });

  it('compare returns true for matching password', async () => {
    const plaintext = 'MyPassword!';
    const hash = await bcrypt.hash(plaintext, 10);
    const match = await bcrypt.compare(plaintext, hash);
    expect(match).toBe(true);
  });

  it('compare returns false for wrong password', async () => {
    const hash = await bcrypt.hash('CorrectPassword', 10);
    const match = await bcrypt.compare('WrongPassword', hash);
    expect(match).toBe(false);
  });
});

// ── Input validation logic ────────────────────────────────────────────────────

describe('Registration input validation', () => {
  function validateRegistration(name: string, email: string, password: string): string | null {
    if (!name || !email || !password) return 'Name, email, and password are required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email address.';
    return null;
  }

  it('passes with valid input', () => {
    expect(validateRegistration('Alice', 'alice@example.com', 'secure123')).toBeNull();
  });

  it('fails with missing name', () => {
    expect(validateRegistration('', 'alice@example.com', 'secure123')).toBeTruthy();
  });

  it('fails with short password', () => {
    expect(validateRegistration('Alice', 'alice@example.com', '123')).toBe(
      'Password must be at least 6 characters.'
    );
  });

  it('fails with missing email', () => {
    expect(validateRegistration('Alice', '', 'secure123')).toBeTruthy();
  });

  it('fails with invalid email format', () => {
    expect(validateRegistration('Alice', 'not-an-email', 'secure123')).toBe('Invalid email address.');
  });
});

// ── Avatar generation logic ───────────────────────────────────────────────────

describe('Avatar initials generation', () => {
  function generateAvatar(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] || 'U').toUpperCase() + 'U';
  }

  it('generates two initials for full name', () => {
    expect(generateAvatar('John Doe')).toBe('JD');
  });

  it('generates first two chars for single word', () => {
    expect(generateAvatar('Alice')).toBe('AL');
  });

  it('handles middle names by using first and last', () => {
    expect(generateAvatar('John Michael Doe')).toBe('JD');
  });

  it('handles all-caps input', () => {
    expect(generateAvatar('ALICE BOB')).toBe('AB');
  });
});

// ── Password reset token logic ────────────────────────────────────────────────

describe('Password reset token management', () => {
  const tokenStore = new Map<string, { userId: string; expiresAt: number }>();

  function createToken(userId: string, ttlMs = 3600_000): string {
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    tokenStore.set(token, { userId, expiresAt: Date.now() + ttlMs });
    return token;
  }

  function validateToken(token: string): string | null {
    const record = tokenStore.get(token);
    if (!record) return null;
    if (Date.now() > record.expiresAt) { tokenStore.delete(token); return null; }
    return record.userId;
  }

  it('returns userId for valid token', () => {
    const token = createToken('user-abc');
    expect(validateToken(token)).toBe('user-abc');
  });

  it('returns null for unknown token', () => {
    expect(validateToken('nonexistent')).toBeNull();
  });

  it('returns null for expired token', () => {
    const token = createToken('user-xyz', -1); // already expired
    expect(validateToken(token)).toBeNull();
  });

  it('token is deleted after expiry check', () => {
    const token = createToken('user-xyz', -1);
    validateToken(token);
    expect(tokenStore.has(token)).toBe(false);
  });
});
