import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/services/jobPostService');

import { GET } from '@/app/api/worker/jobs/[id]/route';
import { getPublicJobPostById } from '@/lib/services/jobPostService';

describe('GET /api/worker/jobs/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the job post when found', async () => {
    vi.mocked(getPublicJobPostById).mockResolvedValue({ id: 'jp1', isClosed: false } as any);
    const res = await GET(new Request('http://localhost'), { params: Promise.resolve({ id: 'jp1' }) });
    expect(res.status).toBe(200);
    expect(getPublicJobPostById).toHaveBeenCalledWith('jp1');
  });

  it('returns 404 when not found', async () => {
    vi.mocked(getPublicJobPostById).mockResolvedValue(null);
    const res = await GET(new Request('http://localhost'), { params: Promise.resolve({ id: 'jp1' }) });
    expect(res.status).toBe(404);
  });
});
