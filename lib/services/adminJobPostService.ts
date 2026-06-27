import { prisma } from '@/lib/db/prisma';
import { createJobPostSchema, PastDeadlineError } from './jobPostService';

export type AdminJobPostFilters = {
  merchantId?: string;
  status?: 'draft' | 'live' | 'paused' | 'expired';
  industry?: string;
  employmentType?: string;
  jobCategory?: string;
  storeId?: string;
  createdFrom?: string;
  createdTo?: string;
};

export async function listAllJobPosts(filters: AdminJobPostFilters = {}) {
  return prisma.jobPost.findMany({
    where: {
      deletedAt: null,
      ...(filters.merchantId ? { merchantId: filters.merchantId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.industry ? { industry: filters.industry } : {}),
      ...(filters.employmentType ? { employmentType: filters.employmentType } : {}),
      ...(filters.jobCategory ? { jobCategory: filters.jobCategory } : {}),
      ...(filters.storeId ? { jobPostStores: { some: { storeId: filters.storeId } } } : {}),
      ...((filters.createdFrom || filters.createdTo)
        ? {
            createdAt: {
              ...(filters.createdFrom ? { gte: new Date(filters.createdFrom) } : {}),
              ...(filters.createdTo ? { lte: new Date(filters.createdTo) } : {}),
            },
          }
        : {}),
    },
    include: {
      merchant: { select: { brandName: true } },
      jobPostStores: { include: { store: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createJobPostAsAdmin(merchantId: string, rawInput: unknown) {
  const input = createJobPostSchema.parse(rawInput);
  if (input.deadline.getTime() < Date.now()) throw new PastDeadlineError();
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
      jobPostStores: { create: input.storeIds.map((storeId) => ({ storeId })) },
    },
    include: { jobPostStores: true },
  });
}

export class MissingReasonError extends Error {}
export class InvalidActionError extends Error {}

export async function moderateJobPost(
  jobPostId: string,
  adminUserId: string,
  action: 'pause',
  reason: string
) {
  if (action !== 'pause') throw new InvalidActionError();
  if (!reason.trim()) throw new MissingReasonError();

  await prisma.jobPost.update({ where: { id: jobPostId }, data: { status: 'paused' } });
  await prisma.jobPostModerationLog.create({
    data: { jobPostId, adminUserId, action, reason },
  });
}
