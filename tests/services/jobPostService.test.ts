import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: { jobPost: { create: vi.fn(), findMany: vi.fn() } },
}));

import { createJobPost, PastDeadlineError } from '@/lib/services/jobPostService';
import { prisma } from '@/lib/db/prisma';

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
    (prisma.jobPost.create as any).mockResolvedValue({ id: 'jp1' });

    await createJobPost('m1', validInput);

    expect(prisma.jobPost.create).toHaveBeenCalledWith(
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

  it('rejects an employment type outside part_time/shift/seasonal', async () => {
    const input = { ...validInput, employmentType: 'full_time' };
    await expect(createJobPost('m1', input)).rejects.toThrow();
  });

  it('rejects an empty storeIds array', async () => {
    const input = { ...validInput, storeIds: [] };
    await expect(createJobPost('m1', input)).rejects.toThrow();
  });
});
