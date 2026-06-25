import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/getSession');
vi.mock('@/lib/services/jobPostService');

import { GET } from '@/app/api/jobs/[id]/route';
import { getSession } from '@/lib/auth/getSession';
import { getJobPostById } from '@/lib/services/jobPostService';

describe('GET /api/jobs/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the job post when it belongs to the calling merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    const jobPost = { id: 'jp1', title: 'Nhân viên pha chế', merchantId: 'm1' };
    vi.mocked(getJobPostById).mockResolvedValue(jobPost as any);

    const req = new Request('http://localhost/api/jobs/jp1', { method: 'GET' });
    const res = await GET(req, { params: Promise.resolve({ id: 'jp1' }) });
    const body = await res.json();

    expect(getJobPostById).toHaveBeenCalledWith('jp1', 'm1');
    expect(res.status).toBe(200);
    expect(body).toEqual(jobPost);
  });

  it('returns 401 when session role is not merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });

    const req = new Request('http://localhost/api/jobs/jp1', { method: 'GET' });
    const res = await GET(req, { params: Promise.resolve({ id: 'jp1' }) });

    expect(res.status).toBe(401);
    expect(getJobPostById).not.toHaveBeenCalled();
  });

  it('returns 401 when there is no session', async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const req = new Request('http://localhost/api/jobs/jp1', { method: 'GET' });
    const res = await GET(req, { params: Promise.resolve({ id: 'jp1' }) });

    expect(res.status).toBe(401);
    expect(getJobPostById).not.toHaveBeenCalled();
  });

  it('returns 404 when the job post does not belong to the calling merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(getJobPostById).mockResolvedValue(null);

    const req = new Request('http://localhost/api/jobs/jp-other', { method: 'GET' });
    const res = await GET(req, { params: Promise.resolve({ id: 'jp-other' }) });

    expect(getJobPostById).toHaveBeenCalledWith('jp-other', 'm1');
    expect(res.status).toBe(404);
  });
});
