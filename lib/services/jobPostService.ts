import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { PAGE_SIZE } from '@/lib/constants/pagination';

export const createJobPostSchema = z.object({
  storeIds: z.array(z.string().guid()).min(1),
  title: z.string().min(1),
  industry: z.string().min(1),
  jobCategory: z.string().optional(),
  employmentType: z.enum(['part_time', 'shift', 'seasonal', 'full_time']),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  salaryType: z.enum(['hourly', 'shift', 'monthly', 'negotiable']),
  schedule: z.object({
    days: z.array(z.string()),
    start: z.string(),
    end: z.string(),
  }),
  deadline: z.coerce.date(),
  experienceRequired: z.string().optional(),
  requiredSkills: z.array(z.string()).optional(),
  requirements: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'live']).default('draft'),
});

export class PastDeadlineError extends Error {}

export async function createJobPost(merchantId: string, rawInput: unknown) {
  const input = createJobPostSchema.parse(rawInput);

  if (input.deadline.getTime() < Date.now()) {
    throw new PastDeadlineError();
  }

  return prisma.jobPost.create({
    data: {
      merchantId,
      title: input.title,
      industry: input.industry,
      jobCategory: input.jobCategory,
      employmentType: input.employmentType,
      salaryMin: input.salaryMin,
      salaryMax: input.salaryMax,
      salaryType: input.salaryType,
      schedule: input.schedule,
      deadline: input.deadline,
      experienceRequired: input.experienceRequired,
      requiredSkills: input.requiredSkills ?? [],
      requirements: input.requirements,
      benefits: input.benefits ?? [],
      description: input.description,
      status: input.status,
      publishedAt: input.status === 'live' ? new Date() : null,
      jobPostStores: {
        create: input.storeIds.map((storeId) => ({ storeId })),
      },
    },
    include: { jobPostStores: true },
  });
}

export type JobPostFilters = {
  status?: 'draft' | 'live' | 'paused' | 'expired';
  storeId?: string;
  industry?: string;
  page?: number;
  all?: boolean;
};

export async function listJobPosts(merchantId: string, filters: JobPostFilters = {}) {
  const paginate = filters.all !== true;
  const page = filters.page ?? 1;
  const where = {
    merchantId,
    deletedAt: null,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.industry ? { industry: filters.industry } : {}),
    ...(filters.storeId ? { jobPostStores: { some: { storeId: filters.storeId } } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.jobPost.findMany({
      where,
      include: { jobPostStores: { include: { store: true } }, applications: true },
      orderBy: { createdAt: 'desc' },
      ...(paginate ? { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE } : {}),
    }),
    prisma.jobPost.count({ where }),
  ]);

  return { items, total };
}

export async function getJobPostById(id: string, merchantId: string) {
  return prisma.jobPost.findFirst({
    where: { id, merchantId },
    include: { jobPostStores: { include: { store: true } } },
  });
}

export async function pauseJobPost(jobPostId: string, merchantId: string) {
  return prisma.jobPost.update({ where: { id: jobPostId, merchantId }, data: { status: 'paused' } });
}

export async function reactivateJobPost(jobPostId: string, merchantId: string) {
  return prisma.jobPost.update({ where: { id: jobPostId, merchantId }, data: { status: 'live' } });
}

export async function softDeleteJobPost(jobPostId: string, merchantId: string) {
  return prisma.jobPost.update({ where: { id: jobPostId, merchantId }, data: { deletedAt: new Date() } });
}

export async function countJobPostsByStatus(merchantId: string) {
  const groups = await prisma.jobPost.groupBy({
    by: ['status'],
    where: { merchantId, deletedAt: null },
    _count: { status: true },
  });

  const counts = { live: 0, paused: 0, expired: 0 };
  for (const g of groups) {
    if (g.status in counts) counts[g.status as keyof typeof counts] = g._count.status;
  }
  return counts;
}

export type PublicJobFilters = {
  city?: string;
  district?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  employmentTypes?: ('part_time' | 'shift' | 'seasonal')[];
  minSalary?: number;
  industry?: string;
  merchantId?: string;
  page?: number;
  pageSize?: number;
};

export const SALARY_BRACKETS = [3_000_000, 5_000_000, 7_000_000, 10_000_000];

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function liveVisibleWhere() {
  return { status: 'live' as const, deletedAt: null, deadline: { gte: todayStart() }, merchant: { status: 'active' as const } };
}

function salaryThresholdWhere(threshold?: number) {
  if (!threshold) return {};
  return {
    OR: [
      { salaryMax: { gte: threshold } },
      { AND: [{ salaryMax: null }, { salaryMin: { gte: threshold } }] },
    ],
  };
}

function manualLocationWhere(filters: PublicJobFilters) {
  if (!filters.city && !filters.district) return {};
  return {
    jobPostStores: {
      some: {
        store: {
          ...(filters.city ? { city: filters.city } : {}),
          ...(filters.district ? { district: filters.district } : {}),
        },
      },
    },
  };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function listPublicJobPosts(filters: PublicJobFilters = {}) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;

  const baseWhere = { ...liveVisibleWhere(), ...manualLocationWhere(filters) };
  const employmentTypeFilter = filters.employmentTypes?.length
    ? { employmentType: { in: filters.employmentTypes } }
    : {};
  const salaryFilter = salaryThresholdWhere(filters.minSalary);
  const industryFilter = filters.industry ? { industry: filters.industry } : {};
  const merchantFilter = filters.merchantId ? { merchantId: filters.merchantId } : {};

  const fullWhere = { ...baseWhere, ...employmentTypeFilter, ...salaryFilter, ...industryFilter, ...merchantFilter };

  let candidates = await prisma.jobPost.findMany({
    where: fullWhere,
    include: { merchant: true, jobPostStores: { include: { store: true } } },
    orderBy: { createdAt: 'desc' },
  });

  if (filters.lat != null && filters.lng != null && filters.radiusKm != null) {
    candidates = candidates.filter((jp) => {
      const store = jp.jobPostStores[0]?.store;
      if (!store?.lat || !store?.lng) return false;
      return haversineKm(filters.lat!, filters.lng!, Number(store.lat), Number(store.lng)) <= filters.radiusKm!;
    });
  }

  const total = candidates.length;
  const jobs = candidates.slice((page - 1) * pageSize, page * pageSize);

  const employmentTypeGroups = await prisma.jobPost.groupBy({
    by: ['employmentType'],
    where: { ...baseWhere, ...salaryFilter, ...industryFilter, ...merchantFilter },
    _count: true,
  });
  const employmentType: Record<string, number> = {};
  for (const g of employmentTypeGroups as any[]) employmentType[g.employmentType] = g._count;

  const industryGroups = await prisma.jobPost.groupBy({
    by: ['industry'],
    where: { ...baseWhere, ...employmentTypeFilter, ...salaryFilter, ...merchantFilter },
    _count: true,
  });
  const industry: Record<string, number> = {};
  for (const g of industryGroups as any[]) industry[g.industry] = g._count;

  const merchantGroups = (await (prisma.jobPost.groupBy as any)({
    by: ['merchantId'],
    where: { ...baseWhere, ...employmentTypeFilter, ...salaryFilter, ...industryFilter },
    _count: true,
  })) as any[];
  const merchantIds = merchantGroups.map((g) => g.merchantId);
  const merchants = merchantIds.length ? await prisma.merchant.findMany({ where: { id: { in: merchantIds } } }) : [];
  const merchant = merchantGroups.map((g) => {
    const m = merchants.find((mm) => mm.id === g.merchantId);
    return { id: g.merchantId, brandName: m?.brandName ?? '', logoUrl: m?.logoUrl ?? null, count: g._count };
  });

  const minSalary = await Promise.all(
    SALARY_BRACKETS.map(async (threshold) => ({
      threshold,
      count: await prisma.jobPost.count({
        where: {
          ...baseWhere,
          ...employmentTypeFilter,
          ...industryFilter,
          ...merchantFilter,
          ...salaryThresholdWhere(threshold),
        },
      }),
    }))
  );

  return { jobs, total, counts: { employmentType, industry, merchant, minSalary } };
}

export async function getPublicJobPostById(id: string) {
  const jobPost = await prisma.jobPost.findFirst({
    where: { id, status: 'live', deletedAt: null, merchant: { status: 'active' } },
    include: { merchant: true, jobPostStores: { include: { store: true } } },
  });
  if (!jobPost) return null;

  return { ...jobPost, isClosed: jobPost.deadline < todayStart() };
}
