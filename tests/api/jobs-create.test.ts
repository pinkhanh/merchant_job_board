import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/getSession');
vi.mock('@/lib/services/jobPostService');

import { POST, GET } from '@/app/api/jobs/route';
import { getSession } from '@/lib/auth/getSession';
import { createJobPost, listJobPosts, PastDeadlineError } from '@/lib/services/jobPostService';

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

describe('createJobPostSchema', () => {
  it('accepts full_time employment type', async () => {
    // Unmock to test the real schema
    vi.doUnmock('@/lib/services/jobPostService');
    const { createJobPostSchema } = await import('@/lib/services/jobPostService');

    const body = {
      storeIds: ['00000000-0000-0000-0000-000000000001'],
      title: 'Quản lý ca',
      industry: 'F&B',
      employmentType: 'full_time',
      salaryType: 'monthly',
      schedule: { days: ['mon'], start: '08:00', end: '17:00' },
      deadline: new Date(Date.now() + 86400000 * 30).toISOString(),
      status: 'live',
    };
    expect(() => createJobPostSchema.parse(body)).not.toThrow();
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

  it('passes the page query param and returns the { items, total } shape', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(listJobPosts).mockResolvedValue({ items: [{ id: 'jp1' }], total: 12 } as any);

    const req = new Request('http://localhost/api/jobs?page=2');
    const res = await GET(req);
    const body = await res.json();

    expect(listJobPosts).toHaveBeenCalledWith('m1', {
      status: undefined,
      storeId: undefined,
      industry: undefined,
      page: 2,
      all: false,
    });
    expect(body).toEqual({ items: [{ id: 'jp1' }], total: 12 });
  });

  it('returns all items (no pagination) when no page query param is given', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(listJobPosts).mockResolvedValue({ items: [], total: 0 } as any);

    const req = new Request('http://localhost/api/jobs');
    await GET(req);

    expect(listJobPosts).toHaveBeenCalledWith('m1', {
      status: undefined,
      storeId: undefined,
      industry: undefined,
      page: 1,
      all: true,
    });
  });
});
