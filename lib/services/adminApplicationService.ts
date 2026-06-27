import { prisma } from '@/lib/db/prisma';

export type AdminApplicationFilters = {
  merchantId?: string;
  jobPostId?: string;
  jobPostTitle?: string;
  importStatus?: 'new' | 'imported';
  appliedFrom?: string;
  appliedTo?: string;
};

type SafeApplication = {
  id: string;
  applicantName: string;
  maskedPhone: string;
  importStatus: string;
  appliedAt: Date;
  jobPost: {
    title: string;
    merchant: { brandName: string };
    jobPostStores: { store: { name: string } }[];
  };
};

function appliedAtRangeFilter(filters: AdminApplicationFilters) {
  if (!filters.appliedFrom && !filters.appliedTo) return {};
  return {
    appliedAt: {
      ...(filters.appliedFrom ? { gte: new Date(filters.appliedFrom) } : {}),
      ...(filters.appliedTo ? { lte: new Date(filters.appliedTo) } : {}),
    },
  };
}

async function fetchApplications(filters: AdminApplicationFilters) {
  return prisma.application.findMany({
    where: {
      ...(filters.jobPostId ? { jobPostId: filters.jobPostId } : {}),
      ...(filters.importStatus ? { importStatus: filters.importStatus } : {}),
      ...(filters.merchantId ? { jobPost: { merchantId: filters.merchantId } } : {}),
      ...(filters.jobPostTitle ? { jobPost: { title: { contains: filters.jobPostTitle, mode: 'insensitive' } } } : {}),
      ...appliedAtRangeFilter(filters),
    },
    include: {
      jobPost: {
        select: {
          title: true,
          merchant: { select: { brandName: true } },
          jobPostStores: { include: { store: { select: { name: true } } } },
        },
      },
    },
    orderBy: { appliedAt: 'desc' },
  });
}

export async function listAllApplications(filters: AdminApplicationFilters = {}): Promise<SafeApplication[]> {
  const applications = await fetchApplications(filters);
  return applications.map((a) => ({
    id: a.id,
    applicantName: a.applicantName,
    maskedPhone: a.phoneNumber.slice(0, 2) + '••••••' + a.phoneNumber.slice(8),
    importStatus: a.importStatus,
    appliedAt: a.appliedAt,
    jobPost: a.jobPost,
  }));
}

export async function exportAllApplicationsCsv(filters: AdminApplicationFilters = {}): Promise<string> {
  const applications = await listAllApplications(filters);
  const header = 'name,merchant,job_post,import_status,applied_at';
  const rows = applications.map(
    (a) =>
      `${a.applicantName},${a.jobPost.merchant.brandName},${a.jobPost.title},${a.importStatus},${
        a.appliedAt ? a.appliedAt.toISOString() : ''
      }`
  );
  return [header, ...rows].join('\n');
}
