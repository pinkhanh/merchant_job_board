import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export type ApplicationFilters = {
  jobPostId?: string;
  importStatus?: 'new' | 'imported';
};

export class ApplicationNotFoundError extends Error {}

export async function listApplications(merchantId: string, filters: ApplicationFilters = {}) {
  return prisma.application.findMany({
    where: {
      jobPost: { merchantId },
      ...(filters.jobPostId ? { jobPostId: filters.jobPostId } : {}),
      ...(filters.importStatus ? { importStatus: filters.importStatus } : {}),
    },
    include: { jobPost: { select: { title: true } } },
    orderBy: { appliedAt: 'desc' },
  });
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
  const applications = await listApplications(merchantId, filters);
  const header = 'name,phone,job_post,import_status,applied_at';
  const rows = applications.map(
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
