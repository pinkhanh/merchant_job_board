import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';

export type MerchantFilters = {
  status?: 'active' | 'inactive';
  industry?: string;
};

export async function listMerchants(filters: MerchantFilters = {}) {
  return prisma.merchant.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.industry ? { industry: filters.industry } : {}),
    },
    include: { _count: { select: { stores: true, jobPosts: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export const createMerchantSchema = z.object({
  brandName: z.string().min(1),
  industry: z.string().min(1),
  username: z.string().min(3),
  password: z.string().min(8),
});

export async function createMerchant(rawInput: unknown) {
  const input = createMerchantSchema.parse(rawInput);
  const passwordHash = await hashPassword(input.password);

  return prisma.$transaction(async (tx) => {
    const merchant = await tx.merchant.create({
      data: { brandName: input.brandName, industry: input.industry },
    });
    const user = await tx.user.create({
      data: {
        username: input.username,
        passwordHash,
        role: 'merchant',
        merchantId: merchant.id,
        isActive: true,
      },
      select: { id: true, username: true, role: true, merchantId: true, isActive: true, createdAt: true },
    });
    return { merchant, user };
  });
}

export async function setMerchantStatus(merchantId: string, status: 'active' | 'inactive') {
  return prisma.merchant.update({ where: { id: merchantId }, data: { status } });
}

export async function getMerchantById(id: string) {
  return prisma.merchant.findUnique({ where: { id }, include: { stores: true } });
}
