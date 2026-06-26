import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    $transaction: vi.fn((fn: any) => fn({
      merchant: { create: vi.fn().mockResolvedValue({ id: 'm1', brandName: 'Jollibee' }) },
      user: { create: vi.fn().mockResolvedValue({ id: 'u1', username: 'jollibee_admin', role: 'merchant', merchantId: 'm1', isActive: true, createdAt: new Date() }) },
    })),
    merchant: { findMany: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
    user: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import {
  listMerchants,
  createMerchant,
  setMerchantStatus,
  getMerchantById,
  updateMerchant,
  listMerchantAccounts,
  createMerchantAccount,
  updateMerchantAccount,
  deleteMerchantAccount,
  UsernameConflictError,
  LastAccountError,
} from '@/lib/services/adminMerchantService';
import { prisma } from '@/lib/db/prisma';

describe('adminMerchantService', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── existing tests (unchanged) ──────────────────────────────────────────

  it('lists merchants with their store count', async () => {
    (prisma.merchant.findMany as any).mockResolvedValue([{ id: 'm1', brandName: 'Jollibee', _count: { stores: 8 } }]);

    const result = await listMerchants({});

    expect(prisma.merchant.findMany).toHaveBeenCalledWith({
      where: {},
      include: { _count: { select: { stores: true, jobPosts: true } } },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([{ id: 'm1', brandName: 'Jollibee', _count: { stores: 8 } }]);
  });

  it('creates a merchant and its first user login together', async () => {
    const result = await createMerchant({
      brandName: 'Jollibee',
      industry: 'F&B',
      username: 'jollibee_admin',
      password: 'TempPass123!',
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result.merchant.brandName).toBe('Jollibee');
    expect(result.user.username).toBe('jollibee_admin');
  });

  it('does not return passwordHash in user object', async () => {
    const result = await createMerchant({
      brandName: 'Jollibee',
      industry: 'F&B',
      username: 'jollibee_admin',
      password: 'TempPass123!',
    });

    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('activates and deactivates a merchant', async () => {
    await setMerchantStatus('m1', 'inactive');
    expect(prisma.merchant.update).toHaveBeenCalledWith({ where: { id: 'm1' }, data: { status: 'inactive' } });
  });

  it('fetches a merchant by id with its stores', async () => {
    (prisma.merchant.findUnique as any).mockResolvedValue({
      id: 'm1',
      brandName: 'Jollibee',
      stores: [{ id: 's1', name: 'Cửa hàng Quận 1' }],
    });

    const result = await getMerchantById('m1');

    expect(prisma.merchant.findUnique).toHaveBeenCalledWith({
      where: { id: 'm1' },
      include: { stores: true },
    });
    expect(result).toEqual({
      id: 'm1',
      brandName: 'Jollibee',
      stores: [{ id: 's1', name: 'Cửa hàng Quận 1' }],
    });
  });

  it('returns null when the merchant does not exist', async () => {
    (prisma.merchant.findUnique as any).mockResolvedValue(null);

    const result = await getMerchantById('missing');

    expect(result).toBeNull();
  });

  // ── updateMerchant ───────────────────────────────────────────────────────

  it('updates merchant fields via updateMerchant', async () => {
    (prisma.merchant.update as any).mockResolvedValue({ id: 'm1', brandName: 'NewName' });

    await updateMerchant('m1', { brandName: 'NewName', hotline: '0901234567' });

    expect(prisma.merchant.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { brandName: 'NewName', hotline: '0901234567' },
    });
  });

  it('updateMerchant throws ZodError when brandName is empty string', async () => {
    const { ZodError } = await import('zod');
    await expect(updateMerchant('m1', { brandName: '' })).rejects.toBeInstanceOf(ZodError);
  });

  // ── listMerchantAccounts ─────────────────────────────────────────────────

  it('lists accounts for a merchant ordered by createdAt asc', async () => {
    const mockAccounts = [
      { id: 'u1', username: 'user1', isActive: true, createdAt: new Date() },
    ];
    (prisma.user.findMany as any).mockResolvedValue(mockAccounts);

    const result = await listMerchantAccounts('m1');

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { merchantId: 'm1', role: 'merchant' },
      select: { id: true, username: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    expect(result).toEqual(mockAccounts);
  });

  // ── createMerchantAccount ────────────────────────────────────────────────

  it('creates a merchant account with hashed password', async () => {
    const created = { id: 'u2', username: 'newuser', isActive: true, createdAt: new Date() };
    (prisma.user.create as any).mockResolvedValue(created);

    const result = await createMerchantAccount('m1', { username: 'newuser', password: 'Pass1234!' });

    const callArg = (prisma.user.create as any).mock.calls[0][0];
    expect(callArg.data.username).toBe('newuser');
    expect(callArg.data.merchantId).toBe('m1');
    expect(callArg.data.role).toBe('merchant');
    expect(callArg.data.passwordHash).toBeDefined();
    expect(callArg.data.passwordHash).not.toBe('Pass1234!');
    expect(result).toEqual(created);
  });

  it('throws UsernameConflictError on P2002', async () => {
    (prisma.user.create as any).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed.', {
        code: 'P2002',
        clientVersion: 'test',
      })
    );

    await expect(
      createMerchantAccount('m1', { username: 'taken', password: 'Pass1234!' })
    ).rejects.toBeInstanceOf(UsernameConflictError);
  });

  it('createMerchantAccount throws ZodError when password is too short', async () => {
    const { ZodError } = await import('zod');
    await expect(
      createMerchantAccount('m1', { username: 'ok', password: 'short' })
    ).rejects.toBeInstanceOf(ZodError);
  });

  // ── updateMerchantAccount ────────────────────────────────────────────────

  it('changes password when password key is provided', async () => {
    (prisma.user.findFirst as any).mockResolvedValue({ id: 'u1', merchantId: 'm1' });

    await updateMerchantAccount('m1', 'u1', { password: 'NewPass123!' });

    const updateCall = (prisma.user.update as any).mock.calls[0][0];
    expect(updateCall.where).toEqual({ id: 'u1' });
    expect(updateCall.data.passwordHash).toBeDefined();
    expect(updateCall.data.isActive).toBeUndefined();
  });

  it('toggles isActive when isActive key is provided', async () => {
    (prisma.user.findFirst as any).mockResolvedValue({ id: 'u1', merchantId: 'm1' });

    await updateMerchantAccount('m1', 'u1', { isActive: false });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { isActive: false },
    });
  });

  it('throws when userId does not belong to merchantId', async () => {
    (prisma.user.findFirst as any).mockResolvedValue(null);

    await expect(updateMerchantAccount('m1', 'u-other', { isActive: false })).rejects.toThrow('Not found');
  });

  // ── deleteMerchantAccount ────────────────────────────────────────────────

  it('deletes an account when merchant has more than one', async () => {
    (prisma.user.count as any).mockResolvedValue(2);
    (prisma.user.findFirst as any).mockResolvedValue({ id: 'u1', merchantId: 'm1' });

    await deleteMerchantAccount('m1', 'u1');

    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('throws LastAccountError when only one account remains', async () => {
    (prisma.user.count as any).mockResolvedValue(1);

    await expect(deleteMerchantAccount('m1', 'u1')).rejects.toBeInstanceOf(LastAccountError);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('throws when userId does not belong to merchantId on delete', async () => {
    (prisma.user.count as any).mockResolvedValue(3);
    (prisma.user.findFirst as any).mockResolvedValue(null);

    await expect(deleteMerchantAccount('m1', 'u-other')).rejects.toThrow('Not found');
  });
});
