import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: { merchant: { findUnique: vi.fn(), update: vi.fn() } },
}));

import { getMerchantProfile, updateMerchantProfile } from '@/lib/services/merchantProfileService';
import { prisma } from '@/lib/db/prisma';

describe('merchantProfileService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches a merchant profile including stores', async () => {
    (prisma.merchant.findUnique as any).mockResolvedValue({ id: 'm1', brandName: 'Jollibee' });

    const profile = await getMerchantProfile('m1');

    expect(prisma.merchant.findUnique).toHaveBeenCalledWith({
      where: { id: 'm1' },
      include: { stores: true },
    });
    expect(profile).toEqual({ id: 'm1', brandName: 'Jollibee' });
  });

  it('updates editable profile fields', async () => {
    await updateMerchantProfile('m1', { description: 'New description', hotline: '19001234' });

    expect(prisma.merchant.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { description: 'New description', hotline: '19001234' },
    });
  });

  it('strips unexpected fields before reaching prisma (mass-assignment protection)', async () => {
    await updateMerchantProfile('m1', { description: 'x', status: 'active', brandName: 'Hacked' } as any);

    expect(prisma.merchant.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { description: 'x' },
    });
  });
});
