import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: { merchant: { findUnique: vi.fn(), update: vi.fn() } },
}));

import { getMerchantProfile, updateMerchantProfile } from '@/lib/services/merchantProfileService';
import { prisma } from '@/lib/db/prisma';

describe('merchantProfileService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches a merchant profile', async () => {
    (prisma.merchant.findUnique as any).mockResolvedValue({ id: 'm1', brandName: 'Jollibee' });

    const profile = await getMerchantProfile('m1');

    expect(prisma.merchant.findUnique).toHaveBeenCalledWith({ where: { id: 'm1' } });
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

  it('updates jobCategories', async () => {
    await updateMerchantProfile('m1', { jobCategories: ['Bán hàng', 'Phục vụ'] });

    expect(prisma.merchant.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { jobCategories: ['Bán hàng', 'Phục vụ'] },
    });
  });

  it('returns logoUrl/bannerUrl/industry/jobCategories from the merchant row as-is', async () => {
    (prisma.merchant.findUnique as any).mockResolvedValue({
      id: 'm1',
      brandName: 'Jollibee',
      logoUrl: 'https://cdn.example.com/logo.png',
      bannerUrl: 'https://cdn.example.com/banner.png',
      industry: 'F&B',
      jobCategories: ['Bán hàng'],
    });

    const profile = await getMerchantProfile('m1');

    expect(profile).toEqual({
      id: 'm1',
      brandName: 'Jollibee',
      logoUrl: 'https://cdn.example.com/logo.png',
      bannerUrl: 'https://cdn.example.com/banner.png',
      industry: 'F&B',
      jobCategories: ['Bán hàng'],
    });
  });
});
