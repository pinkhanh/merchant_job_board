import { prisma } from '@/lib/db/prisma';

export async function getMerchantProfile(merchantId: string) {
  return prisma.merchant.findUnique({ where: { id: merchantId }, include: { stores: true } });
}

export async function updateMerchantProfile(
  merchantId: string,
  data: Partial<{ description: string; hotline: string }>
) {
  return prisma.merchant.update({ where: { id: merchantId }, data });
}
