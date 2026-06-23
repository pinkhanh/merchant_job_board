import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/services/jobPostService');

import { GET } from '@/app/api/worker/jobs/route';
import { listPublicJobPosts } from '@/lib/services/jobPostService';

describe('GET /api/worker/jobs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('parses query params and returns the service result', async () => {
    vi.mocked(listPublicJobPosts).mockResolvedValue({
      jobs: [],
      total: 0,
      counts: { employmentType: {}, industry: {}, merchant: [], minSalary: [] },
    } as any);

    const req = new Request(
      'http://localhost/api/worker/jobs?city=H%E1%BB%93%20Ch%C3%AD%20Minh&employmentType=shift,seasonal&minSalary=5000000&page=2'
    );
    const res = await GET(req);

    expect(listPublicJobPosts).toHaveBeenCalledWith({
      city: 'Hồ Chí Minh',
      district: undefined,
      lat: undefined,
      lng: undefined,
      radiusKm: undefined,
      employmentTypes: ['shift', 'seasonal'],
      minSalary: 5000000,
      industry: undefined,
      merchantId: undefined,
      page: 2,
    });
    expect(res.status).toBe(200);
  });
});
