import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/getSession');
vi.mock('@/lib/services/jobPostService');
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    application: { count: vi.fn() },
  },
}));

import { GET } from '@/app/api/merchant/dashboard-counts/route';
import { getSession } from '@/lib/auth/getSession';
import { countJobPostsByStatus } from '@/lib/services/jobPostService';
import { prisma } from '@/lib/db/prisma';

describe('GET /api/merchant/dashboard-counts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the job post counts for the logged-in merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(countJobPostsByStatus).mockResolvedValue({ live: 12, paused: 5, expired: 0 });
    vi.mocked(prisma.application.count).mockResolvedValue(8);

    const res = await GET();
    const body = await res.json();

    expect(countJobPostsByStatus).toHaveBeenCalledWith('m1');
    expect(body).toEqual({ live: 12, paused: 5, expired: 0, totalApplicants: 8 });
  });

  it('returns 401 when there is no merchant session', async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 401 when session role is not merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });

    const res = await GET();
    expect(res.status).toBe(401);
  });
});
