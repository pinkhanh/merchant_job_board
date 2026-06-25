import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/getSession');
vi.mock('@/lib/services/applicationService');

import { GET } from '@/app/api/applications/export/route';
import { getSession } from '@/lib/auth/getSession';
import * as applicationService from '@/lib/services/applicationService';

describe('GET /api/applications/export', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 for a non-merchant session', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    const res = await GET(new Request('http://localhost/api/applications/export'));
    expect(res.status).toBe(401);
  });

  it('exports a CSV scoped to the calling merchant with no filters by default', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(applicationService.exportApplicationsCsv).mockResolvedValue('name,phone,job_post,import_status,applied_at');

    const res = await GET(new Request('http://localhost/api/applications/export'));
    const body = await res.text();

    expect(applicationService.exportApplicationsCsv).toHaveBeenCalledWith('m1', {
      jobPostId: undefined,
      jobPostTitle: undefined,
      importStatus: undefined,
      appliedFrom: undefined,
      appliedTo: undefined,
    });
    expect(res.headers.get('Content-Type')).toBe('text/csv');
    expect(body).toBe('name,phone,job_post,import_status,applied_at');
  });

  it('passes jobPostId, jobPostTitle, importStatus, and applied date range query params through', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(applicationService.exportApplicationsCsv).mockResolvedValue('');

    await GET(
      new Request(
        'http://localhost/api/applications/export?jobPostId=jp1&jobPostTitle=pha+che&importStatus=imported&appliedFrom=2026-01-01&appliedTo=2026-01-31'
      )
    );

    expect(applicationService.exportApplicationsCsv).toHaveBeenCalledWith('m1', {
      jobPostId: 'jp1',
      jobPostTitle: 'pha che',
      importStatus: 'imported',
      appliedFrom: '2026-01-01',
      appliedTo: '2026-01-31',
    });
  });
});
