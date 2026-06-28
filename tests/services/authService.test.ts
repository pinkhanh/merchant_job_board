// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashPassword } from '@/lib/auth/password';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    userMerchant: { count: vi.fn() },
  },
}));

import { login, InvalidCredentialsError, InactiveAccountError } from '@/lib/services/authService';
import { prisma } from '@/lib/db/prisma';

describe('authService.login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_SECRET = 'test-secret-key-for-vitest-only';
    // Default: single-brand user
    (prisma.userMerchant.count as any).mockResolvedValue(1);
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

  it('returns requiresBrandSelection: true when user has multiple merchants', async () => {
    const passwordHash = await hashPassword('correct-password');
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'u1', username: 'multi_brand_user', passwordHash, role: 'merchant', merchantId: 'm1', isActive: true,
    });
    (prisma.userMerchant.count as any).mockResolvedValue(2);

    const result = await login('multi_brand_user', 'correct-password');
    expect(result.requiresBrandSelection).toBe(true);
    expect(result.userId).toBe('u1');
    expect((result as any).token).toBeUndefined();
  });
});
