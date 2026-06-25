import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { PAGE_SIZE } from '@/lib/constants/pagination';

export type ApplicationFilters = {
  jobPostId?: string;
  jobPostTitle?: string;
  importStatus?: 'new' | 'imported';
  appliedFrom?: string;
  appliedTo?: string;
  page?: number;
};

export class ApplicationNotFoundError extends Error {}

function appliedAtRangeFilter(filters: ApplicationFilters) {
  if (!filters.appliedFrom && !filters.appliedTo) return {};
  return {
    appliedAt: {
      ...(filters.appliedFrom ? { gte: new Date(filters.appliedFrom) } : {}),
      ...(filters.appliedTo ? { lte: new Date(filters.appliedTo) } : {}),
    },
  };
}

export async function listApplications(merchantId: string, filters: ApplicationFilters = {}) {
  const where = {
    jobPost: {
      merchantId,
      ...(filters.jobPostTitle ? { title: { contains: filters.jobPostTitle, mode: Prisma.QueryMode.insensitive } } : {}),
    },
    ...(filters.jobPostId ? { jobPostId: filters.jobPostId } : {}),
    ...(filters.importStatus ? { importStatus: filters.importStatus } : {}),
    ...appliedAtRangeFilter(filters),
  };
  const paginate = filters.page != null;

  const [items, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: { jobPost: { select: { title: true } } },
      orderBy: { appliedAt: 'desc' },
      ...(paginate ? { skip: (filters.page! - 1) * PAGE_SIZE, take: PAGE_SIZE } : {}),
    }),
    prisma.application.count({ where }),
  ]);

  return { items, total };
}

export async function updateImportStatus(applicationId: string, merchantId: string, status: 'new' | 'imported') {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, jobPost: { merchantId } },
  });
  if (!application) throw new ApplicationNotFoundError();

  return prisma.application.update({ where: { id: applicationId }, data: { importStatus: status } });
}

export async function revealPhone(
  applicationId: string,
  merchantId: string,
  revealedByUserId: string
): Promise<string> {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, jobPost: { merchantId } },
  });
  if (!application) throw new ApplicationNotFoundError();

  await prisma.phoneRevealLog.create({
    data: { applicationId, revealedBy: revealedByUserId },
  });

  return application.phoneNumber;
}

export async function exportApplicationsCsv(merchantId: string, filters: ApplicationFilters = {}): Promise<string> {
  const { items } = await listApplications(merchantId, filters);
  const header = 'name,phone,job_post,import_status,applied_at';
  const rows = items.map(
    (a) => `${a.applicantName},${a.phoneNumber},${a.jobPost.title},${a.importStatus},${a.appliedAt.toISOString()}`
  );
  return [header, ...rows].join('\n');
}

const VN_PHONE_REGEX = /^0\d{9}$/;

export const applyInputSchema = z.object({
  jobPostId: z.string().guid(),
  applicantName: z.string().min(1),
  phoneNumber: z.string().regex(VN_PHONE_REGEX, 'Số điện thoại không hợp lệ'),
});

export class DuplicateApplicationError extends Error {}

export async function createApplication(rawInput: unknown) {
  const input = applyInputSchema.parse(rawInput);
  try {
    return await prisma.application.create({ data: input });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new DuplicateApplicationError();
    }
    throw err;
  }
}
