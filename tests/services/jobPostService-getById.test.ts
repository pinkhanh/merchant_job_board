import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({ prisma: { jobPost: { findFirst: vi.fn() } } }));

import { getJobPostById } from '@/lib/services/jobPostService';
import { prisma } from '@/lib/db/prisma';

describe('jobPostService.getJobPostById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the job post when it belongs to the calling merchant', async () => {
    const jobPost = { id: 'jp1', merchantId: 'm1', title: 'Nhân viên pha chế' };
    (prisma.jobPost.findFirst as any).mockResolvedValue(jobPost);

    const result = await getJobPostById('jp1', 'm1');

    expect(prisma.jobPost.findFirst).toHaveBeenCalledWith({
      where: { id: 'jp1', merchantId: 'm1' },
      include: { jobPostStores: { include: { store: true } } },
    });
    expect(result).toEqual(jobPost);
  });

  it('returns null when the job post belongs to a different merchant', async () => {
    (prisma.jobPost.findFirst as any).mockResolvedValue(null);

    const result = await getJobPostById('jp1', 'm2');

    expect(prisma.jobPost.findFirst).toHaveBeenCalledWith({
      where: { id: 'jp1', merchantId: 'm2' },
      include: { jobPostStores: { include: { store: true } } },
    });
    expect(result).toBeNull();
  });
});
