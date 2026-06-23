import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';

export async function getMerchantProfile(merchantId: string) {
  return prisma.merchant.findUnique({ where: { id: merchantId }, include: { stores: true } });
}

const updateMerchantProfileSchema = z.object({
  description: z.string().max(500).optional(),
  hotline: z.string().optional(),
});

export async function updateMerchantProfile(merchantId: string, rawData: unknown) {
  const data = updateMerchantProfileSchema.parse(rawData);
  return prisma.merchant.update({ where: { id: merchantId }, data });
}
