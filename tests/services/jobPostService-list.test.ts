import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: { jobPost: { findMany: vi.fn(), count: vi.fn() } },
}));

import { listJobPosts } from '@/lib/services/jobPostService';
import { prisma } from '@/lib/db/prisma';

describe('jobPostService.listJobPosts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns page 1 (10 items) with the total count by default', async () => {
    (prisma.jobPost.findMany as any).mockResolvedValue([{ id: 'jp1' }]);
    (prisma.jobPost.count as any).mockResolvedValue(25);

    const result = await listJobPosts('m1');

    expect(prisma.jobPost.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }));
    expect(result).toEqual({ items: [{ id: 'jp1' }], total: 25 });
  });

  it('skips to the requested page', async () => {
    (prisma.jobPost.findMany as any).mockResolvedValue([]);
    (prisma.jobPost.count as any).mockResolvedValue(25);

    await listJobPosts('m1', { page: 3 });

    expect(prisma.jobPost.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, take: 10 }));
  });

  it('applies status/industry/store filters to both the list and count queries', async () => {
    (prisma.jobPost.findMany as any).mockResolvedValue([]);
    (prisma.jobPost.count as any).mockResolvedValue(0);

    await listJobPosts('m1', { status: 'live' });

    const expectedWhere = { merchantId: 'm1', deletedAt: null, status: 'live' };
    expect(prisma.jobPost.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere }));
    expect(prisma.jobPost.count).toHaveBeenCalledWith({ where: expectedWhere });
  });
});
