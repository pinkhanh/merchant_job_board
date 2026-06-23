// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashPassword } from '@/lib/auth/password';

vi.mock('@/lib/db/prisma', () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));

import { login, InvalidCredentialsError, InactiveAccountError } from '@/lib/services/authService';
import { prisma } from '@/lib/db/prisma';

describe('authService.login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_SECRET = 'test-secret-key-for-vitest-only';
  });

  it('returns a session token and role for valid credentials', async () => {
    const passwordHash = await hashPassword('correct-password');
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'u1', username: 'merchant1', passwordHash, role: 'merchant', merchantId: 'm1', isActive: true,
    });

    const result = await login('merchant1', 'correct-password');
    expect(typeof result.token).toBe('string');
    expect(result.role).toBe('merchant');
  });

  it('throws InvalidCredentialsError for an unknown username', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    await expect(login('ghost', 'whatever')).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('throws InactiveAccountError for a deactivated account', async () => {
    const passwordHash = await hashPassword('correct-password');
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'u1', username: 'merchant1', passwordHash, role: 'merchant', merchantId: 'm1', isActive: false,
    });
    await expect(login('merchant1', 'correct-password')).rejects.toBeInstanceOf(InactiveAccountError);
  });

  it('throws InvalidCredentialsError for a wrong password', async () => {
    const passwordHash = await hashPassword('correct-password');
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'u1', username: 'merchant1', passwordHash, role: 'merchant', merchantId: 'm1', isActive: true,
    });
    await expect(login('merchant1', 'wrong-password')).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
