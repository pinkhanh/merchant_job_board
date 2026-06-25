import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    $transaction: vi.fn((fn: any) => fn({
      merchant: { create: vi.fn().mockResolvedValue({ id: 'm1', brandName: 'Jollibee' }) },
      user: { create: vi.fn().mockResolvedValue({ id: 'u1', username: 'jollibee_admin', role: 'merchant', merchantId: 'm1', isActive: true, createdAt: new Date() }) },
    })),
    merchant: { findMany: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
  },
}));

import { listMerchants, createMerchant, setMerchantStatus, getMerchantById } from '@/lib/services/adminMerchantService';
import { prisma } from '@/lib/db/prisma';

describe('adminMerchantService', () => {
  beforeEach(() => vi.clearAllMocks());

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
});
