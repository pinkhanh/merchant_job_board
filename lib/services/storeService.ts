import { prisma } from '@/lib/db/prisma';
import { PAGE_SIZE } from '@/lib/constants/pagination';

export type StoreFilters = {
  keyword?: string;
  city?: string;
  district?: string;
  page?: number;
};

export async function listStores(merchantId: string, filters: StoreFilters = {}) {
  const page = filters.page ?? 1;
  const where = {
    merchantId,
    ...(filters.keyword
      ? {
          OR: [
            { name: { contains: filters.keyword, mode: 'insensitive' as const } },
            { streetAddress: { contains: filters.keyword, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(filters.city ? { city: filters.city } : {}),
    ...(filters.district ? { district: filters.district } : {}),
  };

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
