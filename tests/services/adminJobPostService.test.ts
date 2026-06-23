import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    jobPost: { findMany: vi.fn(), update: vi.fn() },
    jobPostModerationLog: { create: vi.fn() },
  },
}));

import {
  listAllJobPosts,
  moderateJobPost,
  MissingReasonError,
  InvalidActionError,
} from '@/lib/services/adminJobPostService';
import { prisma } from '@/lib/db/prisma';

describe('adminJobPostService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists job posts across all merchants', async () => {
    (prisma.jobPost.findMany as any).mockResolvedValue([{ id: 'jp1' }]);

    const result = await listAllJobPosts({});

    expect(prisma.jobPost.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      include: { merchant: { select: { brandName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([{ id: 'jp1' }]);
  });

  it('pauses a job post and logs the reason', async () => {
    await moderateJobPost('jp1', 'admin1', 'pause', 'Vi phạm chính sách nội dung');

    expect(prisma.jobPost.update).toHaveBeenCalledWith({ where: { id: 'jp1' }, data: { status: 'paused' } });
    expect(prisma.jobPostModerationLog.create).toHaveBeenCalledWith({
      data: { jobPostId: 'jp1', adminUserId: 'admin1', action: 'pause', reason: 'Vi phạm chính sách nội dung' },
    });
  });

  it('rejects moderation without a reason', async () => {
    await expect(moderateJobPost('jp1', 'admin1', 'pause', '')).rejects.toBeInstanceOf(MissingReasonError);
  });

  it('rejects an invalid action before mutating the job post', async () => {
    await expect(
      moderateJobPost('jp1', 'admin1', 'delete' as any, 'some reason')
    ).rejects.toBeInstanceOf(InvalidActionError);

    expect(prisma.jobPost.update).not.toHaveBeenCalled();
    expect(prisma.jobPostModerationLog.create).not.toHaveBeenCalled();
  });
});
