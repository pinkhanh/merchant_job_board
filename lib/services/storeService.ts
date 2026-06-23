import { prisma } from '@/lib/db/prisma';

export async function listStores(merchantId: string) {
  return prisma.store.findMany({ where: { merchantId } });
}
