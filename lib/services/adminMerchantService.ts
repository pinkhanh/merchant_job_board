import { z } from 'zod';
import { Prisma } from '@prisma/client';
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
  description: z.string().max(500).optional(),
  hotline: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  bannerUrl: z.string().url().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  username: z.string().min(3),
  password: z.string().min(8),
});

export async function createMerchant(rawInput: unknown) {
  const input = createMerchantSchema.parse(rawInput);
  const passwordHash = await hashPassword(input.password);

  return prisma.$transaction(async (tx) => {
    const merchant = await tx.merchant.create({
      data: {
        brandName: input.brandName,
        industry: input.industry,
        description: input.description,
        hotline: input.hotline,
        logoUrl: input.logoUrl,
        bannerUrl: input.bannerUrl,
      },
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

export const updateMerchantSchema = z.object({
  brandName: z.string().min(1).optional(),
  industry: z.string().min(1).optional(),
  hotline: z.string().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
  jobCategories: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export async function updateMerchant(id: string, rawInput: unknown) {
  const input = updateMerchantSchema.parse(rawInput);
  return prisma.merchant.update({ where: { id }, data: input });
}

const ACCOUNT_SELECT = {
  id: true,
  username: true,
  isActive: true,
  createdAt: true,
} as const;

export async function listMerchantAccounts(merchantId: string) {
  return prisma.user.findMany({
    where: { merchantId, role: 'merchant' },
    select: ACCOUNT_SELECT,
    orderBy: { createdAt: 'asc' },
  });
}

export class UsernameConflictError extends Error {}
export class LastAccountError extends Error {}
export class UserNotFoundError extends Error {}
export class UserAlreadyAssignedError extends Error {}

export const createMerchantAccountSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
});

export async function createMerchantAccount(merchantId: string, rawInput: unknown) {
  const { username, password } = createMerchantAccountSchema.parse(rawInput);
  const passwordHash = await hashPassword(password);
  try {
    return await prisma.user.create({
      data: { username, passwordHash, role: 'merchant', merchantId, isActive: true },
      select: ACCOUNT_SELECT,
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new UsernameConflictError();
    }
    throw e;
  }
}

export async function updateMerchantAccount(
  merchantId: string,
  userId: string,
  input: { password?: string; isActive?: boolean }
) {
  const user = await prisma.user.findFirst({ where: { id: userId, merchantId } });
  if (!user) throw new Error('Not found');

  if (input.password !== undefined) {
    const passwordHash = await hashPassword(input.password);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  } else if (input.isActive !== undefined) {
    await prisma.user.update({ where: { id: userId }, data: { isActive: input.isActive } });
  }
}

export async function deleteMerchantAccount(merchantId: string, userId: string) {
  const count = await prisma.user.count({ where: { merchantId, role: 'merchant' } });
  if (count <= 1) throw new LastAccountError();

  const user = await prisma.user.findFirst({ where: { id: userId, merchantId } });
  if (!user) throw new Error('Not found');

  await prisma.user.delete({ where: { id: userId } });
}

export async function assignUserToMerchant(merchantId: string, username: string) {
  const user = await prisma.user.findFirst({ where: { username } });
  if (!user) throw new UserNotFoundError();
  if (user.merchantId && user.merchantId !== merchantId) {
    throw new UserAlreadyAssignedError('User is already assigned to another merchant');
  }

  return prisma.user.update({
    where: { id: user.id },
    data: { merchantId, role: 'merchant', isActive: true },
    select: ACCOUNT_SELECT,
  });
}
