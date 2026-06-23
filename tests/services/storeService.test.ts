import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: { store: { findMany: vi.fn() } },
}));

import { listStores } from '@/lib/services/storeService';
import { prisma } from '@/lib/db/prisma';

describe('storeService.listStores', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists stores scoped to the given merchant', async () => {
    (prisma.store.findMany as any).mockResolvedValue([{ id: 's1', name: 'Trụ Sở Chính' }]);

    const result = await listStores('m1');

    expect(prisma.store.findMany).toHaveBeenCalledWith({ where: { merchantId: 'm1' } });
    expect(result).toEqual([{ id: 's1', name: 'Trụ Sở Chính' }]);
  });
});
