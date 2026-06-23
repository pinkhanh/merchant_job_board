import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({ prisma: { jobPost: { findFirst: vi.fn() } } }));

import { getPublicJobPostById } from '@/lib/services/jobPostService';
import { prisma } from '@/lib/db/prisma';

describe('jobPostService.getPublicJobPostById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when no live, non-deleted post matches', async () => {
    (prisma.jobPost.findFirst as any).mockResolvedValue(null);
    expect(await getPublicJobPostById('jp1')).toBeNull();
    expect(prisma.jobPost.findFirst).toHaveBeenCalledWith({
      where: { id: 'jp1', status: 'live', deletedAt: null },
      include: { merchant: true, jobPostStores: { include: { store: true } } },
    });
  });

  it('marks isClosed true when the deadline has passed', async () => {
    (prisma.jobPost.findFirst as any).mockResolvedValue({ id: 'jp1', deadline: new Date('2020-01-01') });
    const result = await getPublicJobPostById('jp1');
    expect(result!.isClosed).toBe(true);
  });

  it('marks isClosed false when the deadline is in the future', async () => {
    (prisma.jobPost.findFirst as any).mockResolvedValue({ id: 'jp1', deadline: new Date(Date.now() + 86400000) });
    const result = await getPublicJobPostById('jp1');
    expect(result!.isClosed).toBe(false);
  });
});
