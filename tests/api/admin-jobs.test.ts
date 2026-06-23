import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/getSession');
vi.mock('@/lib/services/adminJobPostService');

import { GET } from '@/app/api/admin/jobs/route';
import { PATCH } from '@/app/api/admin/jobs/[id]/moderate/route';
import { getSession } from '@/lib/auth/getSession';
import * as adminJobPostService from '@/lib/services/adminJobPostService';

describe('admin jobs API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET lists job posts across merchants for an admin session', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminJobPostService.listAllJobPosts).mockResolvedValue([{ id: 'jp1' }] as any);

    const res = await GET(new Request('http://localhost/api/admin/jobs'));
    expect(res.status).toBe(200);
  });

  it('PATCH pauses a job post with a reason', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminJobPostService.moderateJobPost).mockResolvedValue(undefined);

    const req = new Request('http://localhost/api/admin/jobs/jp1/moderate', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'pause', reason: 'Vi phạm chính sách' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'jp1' }) });

    expect(adminJobPostService.moderateJobPost).toHaveBeenCalledWith('jp1', 'u2', 'pause', 'Vi phạm chính sách');
    expect(res.status).toBe(200);
  });

  it('PATCH returns 400 when moderateJobPost rejects a missing reason', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminJobPostService.moderateJobPost).mockRejectedValue(
      new adminJobPostService.MissingReasonError()
    );

    const req = new Request('http://localhost/api/admin/jobs/jp1/moderate', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'pause', reason: '' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'jp1' }) });
    expect(res.status).toBe(400);
  });

  it('PATCH returns 400 when moderateJobPost rejects an invalid action', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminJobPostService.moderateJobPost).mockRejectedValue(
      new adminJobPostService.InvalidActionError()
    );

    const req = new Request('http://localhost/api/admin/jobs/jp1/moderate', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'delete', reason: 'Vi phạm chính sách' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'jp1' }) });
    expect(res.status).toBe(400);
  });
});
