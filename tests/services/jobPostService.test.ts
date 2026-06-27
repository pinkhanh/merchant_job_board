import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCreate, mockFindMany, mockCount } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindMany: vi.fn().mockResolvedValue([]),
  mockCount: vi.fn().mockResolvedValue(0),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    jobPost: { create: mockCreate, findMany: mockFindMany, count: mockCount },
  },
}));

import { createJobPost, listJobPosts, PastDeadlineError } from '@/lib/services/jobPostService';

const validInput = {
  storeIds: ['11111111-1111-1111-1111-111111111111'],
  title: 'Nhân viên pha chế',
  industry: 'F&B',
  employmentType: 'shift',
  salaryType: 'hourly',
  schedule: { days: ['mon', 'tue'], start: '08:00', end: '17:00' },
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

describe('jobPostService.createJobPost', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a job post mapped to multiple stores via the join table', async () => {
    mockCreate.mockResolvedValue({ id: 'jp1' });

    await createJobPost('m1', validInput);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          merchantId: 'm1',
          status: 'draft',
          jobPostStores: { create: [{ storeId: '11111111-1111-1111-1111-111111111111' }] },
        }),
      })
    );
  });

  it('rejects a deadline in the past', async () => {
    const input = { ...validInput, deadline: '2020-01-01' };
    await expect(createJobPost('m1', input)).rejects.toBeInstanceOf(PastDeadlineError);
  });

  it('rejects an employment type outside part_time/shift/seasonal/full_time', async () => {
    const input = { ...validInput, employmentType: 'invalid_type' };
    await expect(createJobPost('m1', input)).rejects.toThrow();
  });

  it('rejects an empty storeIds array', async () => {
    const input = { ...validInput, storeIds: [] };
    await expect(createJobPost('m1', input)).rejects.toThrow();
  });
});

describe('listJobPosts filters', () => {
  beforeEach(() => {
    mockFindMany.mockClear();
    mockCount.mockClear();
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);
  });

  it('passes employmentType filter to prisma', async () => {
    await listJobPosts('m1', { employmentType: 'full_time' });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ employmentType: 'full_time' }),
      })
    );
  });

  it('passes createdFrom filter as gte date', async () => {
    await listJobPosts('m1', { createdFrom: '2026-01-01' });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({ gte: new Date('2026-01-01') }),
        }),
      })
    );
  });

  it('passes createdTo filter as lte date', async () => {
    await listJobPosts('m1', { createdTo: '2026-06-30' });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({ lte: new Date('2026-06-30') }),
        }),
      })
    );
  });

  it('passes storeId filter via jobPostStores relation', async () => {
    await listJobPosts('m1', { storeId: 'store-123' });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          jobPostStores: { some: { storeId: 'store-123' } },
        }),
      })
    );
  });

  it('passes jobCategory filter to prisma', async () => {
    await listJobPosts('m1', { jobCategory: 'barista' });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ jobCategory: 'barista' }),
      })
    );
  });
});
