import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: { jobPost: { update: vi.fn(), groupBy: vi.fn() } },
}));

import { pauseJobPost, reactivateJobPost, softDeleteJobPost, countJobPostsByStatus } from '@/lib/services/jobPostService';
import { prisma } from '@/lib/db/prisma';

describe('jobPostService mutations', () => {
  beforeEach(() => vi.clearAllMocks());

  it('pauses a job post scoped to the calling merchant', async () => {
    await pauseJobPost('jp1', 'm1');
    expect(prisma.jobPost.update).toHaveBeenCalledWith({ where: { id: 'jp1', merchantId: 'm1' }, data: { status: 'paused' } });
  });

  it('reactivates a job post scoped to the calling merchant', async () => {
    await reactivateJobPost('jp1', 'm1');
    expect(prisma.jobPost.update).toHaveBeenCalledWith({ where: { id: 'jp1', merchantId: 'm1' }, data: { status: 'live' } });
  });

  it('soft-deletes a job post scoped to the calling merchant', async () => {
    await softDeleteJobPost('jp1', 'm1');
    expect(prisma.jobPost.update).toHaveBeenCalledWith({
      where: { id: 'jp1', merchantId: 'm1' },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it('counts job posts by status for a merchant', async () => {
    (prisma.jobPost.groupBy as any).mockResolvedValue([
      { status: 'live', _count: { status: 12 } },
      { status: 'paused', _count: { status: 5 } },
    ]);

    const counts = await countJobPostsByStatus('m1');
    expect(counts).toEqual({ live: 12, paused: 5, expired: 0 });
  });
});
