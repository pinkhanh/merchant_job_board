import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/getSession');
vi.mock('@/lib/services/jobPostService');

import { POST, GET } from '@/app/api/jobs/route';
import { getSession } from '@/lib/auth/getSession';
import { createJobPost, PastDeadlineError } from '@/lib/services/jobPostService';

describe('POST /api/jobs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a job post for the logged-in merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(createJobPost).mockResolvedValue({ id: 'jp1' } as any);

    const req = new Request('http://localhost/api/jobs', { method: 'POST', body: JSON.stringify({ title: 'x' }) });
    const res = await POST(req);

    expect(createJobPost).toHaveBeenCalledWith('m1', { title: 'x' });
    expect(res.status).toBe(201);
  });

  it('returns 400 when the deadline is in the past', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(createJobPost).mockRejectedValue(new PastDeadlineError());

    const req = new Request('http://localhost/api/jobs', { method: 'POST', body: JSON.stringify({ title: 'x' }) });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 401 without a merchant session', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const req = new Request('http://localhost/api/jobs', { method: 'POST', body: JSON.stringify({}) });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when session role is not merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    const req = new Request('http://localhost/api/jobs', { method: 'POST', body: JSON.stringify({}) });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/jobs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when session role is not merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    const req = new Request('http://localhost/api/jobs', { method: 'GET' });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
