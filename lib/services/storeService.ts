import { prisma } from '@/lib/db/prisma';
import { PAGE_SIZE } from '@/lib/constants/pagination';

export type StoreFilters = {
  keyword?: string;
  city?: string;
  district?: string;
  page?: number;
};

/**
 * Strips diacritics so that keyword search can match regardless of accents,
 * e.g. "Au Co" should match "Âu Cơ". Postgres's `contains`/`mode: 'insensitive'`
 * is case-insensitive but NOT diacritic-insensitive (it respects the default
 * collation), so this normalization happens in application code instead of
 * relying on a DB-level `unaccent` extension/migration.
 */
function stripDiacritics(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, (match) => (match === 'đ' ? 'd' : 'D'));
}

function normalizeForSearch(value: string): string {
  return stripDiacritics(value).toLowerCase();
}

export async function listStores(merchantId: string, filters: StoreFilters = {}) {
  const page = filters.page ?? 1;
  const where = {
    merchantId,
    ...(filters.city ? { city: filters.city } : {}),
    ...(filters.district ? { district: filters.district } : {}),
  };

  if (!filters.keyword) {
    const [items, total] = await Promise.all([
      prisma.store.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.store.count({ where }),
    ]);

    return { items, total };
  }

  // Diacritic-insensitive keyword matching isn't expressible via Prisma's
  // `contains`/`mode: 'insensitive'` (Postgres's default collation treats
  // accented and unaccented letters as distinct). Fetch the merchant-scoped
  // (and city/district-scoped) candidate rows — bounded per merchant — and
  // filter + paginate in application code using diacritic-normalized
  // comparisons.
  const candidates = await prisma.store.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  const normalizedKeyword = normalizeForSearch(filters.keyword);
  const matches = candidates.filter(
    (store) =>
      normalizeForSearch(store.name).includes(normalizedKeyword) ||
      normalizeForSearch(store.streetAddress).includes(normalizedKeyword)
  );

  const total = matches.length;
  const start = (page - 1) * PAGE_SIZE;
  const items = matches.slice(start, start + PAGE_SIZE);

  return { items, total };
}
