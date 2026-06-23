import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    $transaction: vi.fn((fn: any) => fn({
      merchant: { create: vi.fn().mockResolvedValue({ id: 'm1', brandName: 'Jollibee' }) },
      user: { create: vi.fn().mockResolvedValue({ id: 'u1', username: 'jollibee_admin' }) },
    })),
    merchant: { findMany: vi.fn(), update: vi.fn() },
  },
}));

import { listMerchants, createMerchant, setMerchantStatus } from '@/lib/services/adminMerchantService';
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

  it('activates and deactivates a merchant', async () => {
    await setMerchantStatus('m1', 'inactive');
    expect(prisma.merchant.update).toHaveBeenCalledWith({ where: { id: 'm1' }, data: { status: 'inactive' } });
  });
});
