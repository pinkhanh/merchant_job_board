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
    (prisma.store.findMany as any).mockResolvedValue([
      { id: 's1', name: 'Quan 1 Store', streetAddress: '1 Le Loi' },
    ]);

    const result = await listStores('m1', { keyword: 'quan 1' });

    // Keyword search fetches merchant-scoped candidates and filters/paginates
    // in application code (so diacritics can be normalized), rather than
    // pushing `contains`/`mode: insensitive` down to Prisma.
    expect(prisma.store.findMany).toHaveBeenCalledWith({
      where: { merchantId: 'm1' },
      orderBy: { name: 'asc' },
    });
    expect(prisma.store.count).not.toHaveBeenCalled();
    expect(result).toEqual({ items: [{ id: 's1', name: 'Quan 1 Store', streetAddress: '1 Le Loi' }], total: 1 });
  });

  it('matches keyword against name or street address, diacritic-insensitively', async () => {
    (prisma.store.findMany as any).mockResolvedValue([
      { id: 's1', name: 'Jollibee Âu Cơ', streetAddress: '123 Âu Cơ' },
      { id: 's2', name: 'Highlands Thanh Hóa', streetAddress: '45 Lê Lợi' },
      { id: 's3', name: 'No Match Store', streetAddress: '99 Khong Lien Quan' },
    ]);

    const result = await listStores('m1', { keyword: 'Au Co' });

    expect(result.items).toEqual([{ id: 's1', name: 'Jollibee Âu Cơ', streetAddress: '123 Âu Cơ' }]);
    expect(result.total).toBe(1);
  });

  it('matches a diacritic keyword against a plain-text field (and vice versa)', async () => {
    (prisma.store.findMany as any).mockResolvedValue([
      { id: 's1', name: 'Highlands Coffee', streetAddress: '45 Le Loi' },
    ]);

    const byPlainKeyword = await listStores('m1', { keyword: 'le loi' });
    expect(byPlainKeyword.items.map((s: any) => s.id)).toEqual(['s1']);

    const byAccentedKeyword = await listStores('m1', { keyword: 'Lê Lợi' });
    expect(byAccentedKeyword.items.map((s: any) => s.id)).toEqual(['s1']);
  });

  it('paginates keyword search results in application code', async () => {
    const allStores = Array.from({ length: 15 }, (_, i) => ({
      id: `s${i + 1}`,
      name: `Âu Cơ Store ${String(i + 1).padStart(2, '0')}`,
      streetAddress: `${i + 1} Âu Cơ`,
    }));
    (prisma.store.findMany as any).mockResolvedValue(allStores);

    const page1 = await listStores('m1', { keyword: 'au co' });
    expect(page1.items).toHaveLength(10);
    expect(page1.total).toBe(15);
    expect(page1.items[0].id).toBe('s1');

    const page2 = await listStores('m1', { keyword: 'au co', page: 2 });
    expect(page2.items).toHaveLength(5);
    expect(page2.total).toBe(15);
    expect(page2.items[0].id).toBe('s11');
  });

  it('filters by city and district', async () => {
    (prisma.store.findMany as any).mockResolvedValue([]);
    (prisma.store.count as any).mockResolvedValue(0);

    await listStores('m1', { city: 'Hà Nội', district: 'Cầu Giấy' });

    const expectedWhere = { merchantId: 'm1', city: 'Hà Nội', district: 'Cầu Giấy' };
    expect(prisma.store.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere }));
  });

  it('combines keyword with city/district filters when fetching candidates', async () => {
    (prisma.store.findMany as any).mockResolvedValue([
      { id: 's1', name: 'Jollibee Âu Cơ', streetAddress: '123 Âu Cơ' },
    ]);

    const result = await listStores('m1', { keyword: 'au co', city: 'Hà Nội', district: 'Cầu Giấy' });

    expect(prisma.store.findMany).toHaveBeenCalledWith({
      where: { merchantId: 'm1', city: 'Hà Nội', district: 'Cầu Giấy' },
      orderBy: { name: 'asc' },
    });
    expect(result.items).toHaveLength(1);
  });
});
