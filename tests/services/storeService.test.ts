// tests/services/storeService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: { store: { findMany: vi.fn(), count: vi.fn() } },
}));

import { listStores } from '@/lib/services/storeService';
import { prisma } from '@/lib/db/prisma';

describe('storeService.listStores', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists page 1 (10 items) scoped to the given merchant by default', async () => {
    (prisma.store.findMany as any).mockResolvedValue([{ id: 's1', name: 'Trụ Sở Chính' }]);
    (prisma.store.count as any).mockResolvedValue(1);

    const result = await listStores('m1');

    expect(prisma.store.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { merchantId: 'm1' }, skip: 0, take: 10 })
    );
    expect(result).toEqual({ items: [{ id: 's1', name: 'Trụ Sở Chính' }], total: 1 });
  });

  it('skips to the requested page', async () => {
    (prisma.store.findMany as any).mockResolvedValue([]);
    (prisma.store.count as any).mockResolvedValue(0);

    await listStores('m1', { page: 2 });

    expect(prisma.store.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }));
  });

  it('matches keyword against name or street address, case-insensitively', async () => {
    (prisma.store.findMany as any).mockResolvedValue([]);
    (prisma.store.count as any).mockResolvedValue(0);

    await listStores('m1', { keyword: 'quan 1' });

    const expectedWhere = {
      merchantId: 'm1',
      OR: [
        { name: { contains: 'quan 1', mode: 'insensitive' } },
        { streetAddress: { contains: 'quan 1', mode: 'insensitive' } },
      ],
    };
    expect(prisma.store.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere }));
    expect(prisma.store.count).toHaveBeenCalledWith({ where: expectedWhere });
  });

  it('filters by city and district', async () => {
    (prisma.store.findMany as any).mockResolvedValue([]);
    (prisma.store.count as any).mockResolvedValue(0);

    await listStores('m1', { city: 'Hà Nội', district: 'Cầu Giấy' });

    const expectedWhere = { merchantId: 'm1', city: 'Hà Nội', district: 'Cầu Giấy' };
    expect(prisma.store.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere }));
  });
});
