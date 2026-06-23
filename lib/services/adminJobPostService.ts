import { prisma } from '@/lib/db/prisma';

export type AdminJobPostFilters = {
  merchantId?: string;
  status?: 'draft' | 'live' | 'paused' | 'expired';
  industry?: string;
};

export async function listAllJobPosts(filters: AdminJobPostFilters = {}) {
  return prisma.jobPost.findMany({
    where: {
      deletedAt: null,
      ...(filters.merchantId ? { merchantId: filters.merchantId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.industry ? { industry: filters.industry } : {}),
    },
    include: { merchant: { select: { brandName: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export class MissingReasonError extends Error {}
export class InvalidActionError extends Error {}

export async function moderateJobPost(
  jobPostId: string,
  adminUserId: string,
  action: 'pause' | 'unpublish',
  reason: string
) {
  if (action !== 'pause' && action !== 'unpublish') throw new InvalidActionError();
  if (!reason.trim()) throw new MissingReasonError();

  await prisma.jobPost.update({ where: { id: jobPostId }, data: { status: 'paused' } });
  await prisma.jobPostModerationLog.create({
    data: { jobPostId, adminUserId, action, reason },
  });
}
