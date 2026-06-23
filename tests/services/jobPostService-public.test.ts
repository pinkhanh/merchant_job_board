import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    jobPost: { findMany: vi.fn(), groupBy: vi.fn(), count: vi.fn() },
    merchant: { findMany: vi.fn() },
  },
}));

import { listPublicJobPosts, SALARY_BRACKETS } from '@/lib/services/jobPostService';
import { prisma } from '@/lib/db/prisma';

describe('jobPostService.listPublicJobPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.jobPost.findMany as any).mockResolvedValue([
      {
        id: 'jp1',
        employmentType: 'shift',
        industry: 'F&B',
        merchantId: 'm1',
        salaryMin: 20000,
        salaryMax: 30000,
        createdAt: new Date(),
        jobPostStores: [{ store: { lat: 10.77, lng: 106.7 } }],
      },
    ]);
    (prisma.jobPost.groupBy as any).mockResolvedValue([]);
    (prisma.jobPost.count as any).mockResolvedValue(0);
    (prisma.merchant.findMany as any).mockResolvedValue([]);
  });

  it('only includes live, non-deleted, non-expired posts', async () => {
    await listPublicJobPosts();
    const where = (prisma.jobPost.findMany as any).mock.calls[0][0].where;
    expect(where.status).toBe('live');
    expect(where.deletedAt).toBeNull();
    expect(where.deadline.gte).toBeInstanceOf(Date);
  });

  it('filters by manual city/district location', async () => {
    await listPublicJobPosts({ city: 'Hồ Chí Minh', district: 'Quận 1' });
    const where = (prisma.jobPost.findMany as any).mock.calls[0][0].where;
    expect(where.jobPostStores.some.store).toEqual({ city: 'Hồ Chí Minh', district: 'Quận 1' });
  });

  it('filters by multiple employment types using `in`', async () => {
    await listPublicJobPosts({ employmentTypes: ['shift', 'seasonal'] });
    const where = (prisma.jobPost.findMany as any).mock.calls[0][0].where;
    expect(where.employmentType).toEqual({ in: ['shift', 'seasonal'] });
  });

  it('filters out GPS candidates outside the radius', async () => {
    const result = await listPublicJobPosts({ lat: 0, lng: 0, radiusKm: 5 });
    expect(result.jobs).toHaveLength(0);
  });

  it('keeps GPS candidates inside the radius', async () => {
    const result = await listPublicJobPosts({ lat: 10.77, lng: 106.7, radiusKm: 5 });
    expect(result.jobs).toHaveLength(1);
  });

  it('returns one count entry per salary bracket', async () => {
    const result = await listPublicJobPosts();
    expect(result.counts.minSalary).toHaveLength(SALARY_BRACKETS.length);
    expect(result.counts.minSalary[0]).toEqual({ threshold: SALARY_BRACKETS[0], count: 0 });
  });
});
