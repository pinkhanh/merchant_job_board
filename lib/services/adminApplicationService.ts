import { prisma } from '@/lib/db/prisma';

export type AdminApplicationFilters = {
  merchantId?: string;
  jobPostId?: string;
  importStatus?: 'new' | 'imported';
};

type SafeApplication = {
  id: string;
  applicantName: string;
  importStatus: string;
  appliedAt: Date;
  jobPost: { title: string };
};

async function fetchApplications(filters: AdminApplicationFilters) {
  return prisma.application.findMany({
    where: {
      ...(filters.jobPostId ? { jobPostId: filters.jobPostId } : {}),
      ...(filters.importStatus ? { importStatus: filters.importStatus } : {}),
      ...(filters.merchantId ? { jobPost: { merchantId: filters.merchantId } } : {}),
    },
    include: { jobPost: { select: { title: true } } },
    orderBy: { appliedAt: 'desc' },
  });
}

export async function listAllApplications(filters: AdminApplicationFilters = {}): Promise<SafeApplication[]> {
  const applications = await fetchApplications(filters);
  return applications.map((a) => ({
    id: a.id,
    applicantName: a.applicantName,
    importStatus: a.importStatus,
    appliedAt: a.appliedAt,
    jobPost: a.jobPost,
  }));
}

export async function exportAllApplicationsCsv(filters: AdminApplicationFilters = {}): Promise<string> {
  const applications = await listAllApplications(filters);
  const header = 'name,job_post,import_status,applied_at';
  const rows = applications.map(
    (a) => `${a.applicantName},${a.jobPost.title},${a.importStatus},${a.appliedAt ? a.appliedAt.toISOString() : ''}`
  );
  return [header, ...rows].join('\n');
}
