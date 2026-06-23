import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';

export const createJobPostSchema = z.object({
  storeIds: z.array(z.string().guid()).min(1),
  title: z.string().min(1),
  industry: z.string().min(1),
  jobCategory: z.string().optional(),
  employmentType: z.enum(['part_time', 'shift', 'seasonal']),
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
};

export async function listJobPosts(merchantId: string, filters: JobPostFilters = {}) {
  return prisma.jobPost.findMany({
    where: {
      merchantId,
      deletedAt: null,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.industry ? { industry: filters.industry } : {}),
      ...(filters.storeId ? { jobPostStores: { some: { storeId: filters.storeId } } } : {}),
    },
    include: { jobPostStores: { include: { store: true } }, applications: true },
    orderBy: { createdAt: 'desc' },
  });
}
