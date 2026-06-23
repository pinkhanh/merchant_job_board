import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

vi.mock('@/lib/auth/getSession');
vi.mock('@/lib/services/jobPostService');

import { PATCH } from '@/app/api/jobs/[id]/route';
import { getSession } from '@/lib/auth/getSession';
import { pauseJobPost, reactivateJobPost, softDeleteJobPost } from '@/lib/services/jobPostService';

function makeP2025Error() {
  return new Prisma.PrismaClientKnownRequestError('Record to update not found.', {
    code: 'P2025',
    clientVersion: 'test',
  });
}

describe('PATCH /api/jobs/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('pauses a job post when action=pause', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(pauseJobPost).mockResolvedValue({} as any);

    const req = new Request('http://localhost/api/jobs/jp1', { method: 'PATCH', body: JSON.stringify({ action: 'pause' }) });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'jp1' }) });

    expect(pauseJobPost).toHaveBeenCalledWith('jp1', 'm1');
    expect(res.status).toBe(200);
  });

  it('reactivates a job post when action=reactivate', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(reactivateJobPost).mockResolvedValue({} as any);

    const req = new Request('http://localhost/api/jobs/jp1', { method: 'PATCH', body: JSON.stringify({ action: 'reactivate' }) });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'jp1' }) });

    expect(reactivateJobPost).toHaveBeenCalledWith('jp1', 'm1');
    expect(res.status).toBe(200);
  });

  it('soft-deletes a job post when action=delete', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(softDeleteJobPost).mockResolvedValue({} as any);

    const req = new Request('http://localhost/api/jobs/jp1', { method: 'PATCH', body: JSON.stringify({ action: 'delete' }) });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'jp1' }) });

    expect(softDeleteJobPost).toHaveBeenCalledWith('jp1', 'm1');
    expect(res.status).toBe(200);
  });

  it('returns 401 when session role is not merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });

    const req = new Request('http://localhost/api/jobs/jp1', { method: 'PATCH', body: JSON.stringify({ action: 'pause' }) });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'jp1' }) });

    expect(res.status).toBe(401);
    expect(pauseJobPost).not.toHaveBeenCalled();
  });

  it('returns 404 when targeting a job post belonging to a different merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(pauseJobPost).mockRejectedValue(makeP2025Error());

    const req = new Request('http://localhost/api/jobs/jp-other', { method: 'PATCH', body: JSON.stringify({ action: 'pause' }) });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'jp-other' }) });

    expect(pauseJobPost).toHaveBeenCalledWith('jp-other', 'm1');
    expect(res.status).toBe(404);
  });
});
