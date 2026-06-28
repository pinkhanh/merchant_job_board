import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    jobPost: { findMany: vi.fn(), update: vi.fn(), create: vi.fn() },
    jobPostModerationLog: { create: vi.fn() },
  },
}));

import {
  listAllJobPosts,
  moderateJobPost,
  MissingReasonError,
  InvalidActionError,
  createJobPostAsAdmin,
} from '@/lib/services/adminJobPostService';
import { PastDeadlineError } from '@/lib/services/jobPostService';
import { prisma } from '@/lib/db/prisma';

describe('adminJobPostService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists job posts across all merchants', async () => {
    (prisma.jobPost.findMany as any).mockResolvedValue([{ id: 'jp1' }]);

    const result = await listAllJobPosts({});

    expect(prisma.jobPost.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      include: {
        merchant: { select: { brandName: true } },
        jobPostStores: { include: { store: { select: { name: true } } } },
      },
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

  it('rejects the legacy unpublish action since pause is now the only valid action', async () => {
    await expect(
      moderateJobPost('jp1', 'admin1', 'unpublish' as any, 'some reason')
    ).rejects.toBeInstanceOf(InvalidActionError);

    expect(prisma.jobPost.update).not.toHaveBeenCalled();
    expect(prisma.jobPostModerationLog.create).not.toHaveBeenCalled();
  });

  it('passes employmentType filter to prisma', async () => {
    await listAllJobPosts({ employmentType: 'full_time' });
    expect(prisma.jobPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ employmentType: 'full_time' }),
      })
    );
  });

  const validJobPostInput = {
    storeIds: ['00000000-0000-0000-0000-000000000001'],
    title: 'Nhân viên pha chế',
    industry: 'F&B',
    employmentType: 'part_time' as const,
    salaryType: 'hourly' as const,
    schedule: { days: ['Mon'], start: '08:00', end: '17:00' },
    deadline: new Date(Date.now() + 86400000 * 30),
  };

  it('createJobPostAsAdmin calls prisma.create with merchantId and validated data', async () => {
    (prisma.jobPost.create as any).mockResolvedValue({ id: 'jp-new' });
    const result = await createJobPostAsAdmin('merchant-1', validJobPostInput);
    expect(prisma.jobPost.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ merchantId: 'merchant-1', title: 'Nhân viên pha chế' }) })
    );
    expect(result).toEqual({ id: 'jp-new' });
  });

  it('createJobPostAsAdmin throws PastDeadlineError for past deadline', async () => {
    await expect(
      createJobPostAsAdmin('merchant-1', { ...validJobPostInput, deadline: new Date(Date.now() - 1000) })
    ).rejects.toBeInstanceOf(PastDeadlineError);
    expect(prisma.jobPost.create).not.toHaveBeenCalled();
  });
});
