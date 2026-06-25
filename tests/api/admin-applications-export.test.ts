import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/getSession');
vi.mock('@/lib/services/adminApplicationService');

import { GET } from '@/app/api/admin/applications/export/route';
import { getSession } from '@/lib/auth/getSession';
import * as adminApplicationService from '@/lib/services/adminApplicationService';

describe('GET /api/admin/applications/export', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 for a non-admin session', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    const res = await GET(new Request('http://localhost/api/admin/applications/export'));
    expect(res.status).toBe(401);
  });

  it('exports a CSV with no filters by default', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminApplicationService.exportAllApplicationsCsv).mockResolvedValue(
      'name,merchant,job_post,import_status,applied_at'
    );

    const res = await GET(new Request('http://localhost/api/admin/applications/export'));
    const body = await res.text();

    expect(adminApplicationService.exportAllApplicationsCsv).toHaveBeenCalledWith({
      merchantId: undefined,
      jobPostId: undefined,
      jobPostTitle: undefined,
      importStatus: undefined,
      appliedFrom: undefined,
      appliedTo: undefined,
    });
    expect(res.headers.get('Content-Type')).toBe('text/csv');
    expect(body).toBe('name,merchant,job_post,import_status,applied_at');
  });

  it('passes merchantId, jobPostId, jobPostTitle, importStatus, and applied date range query params through', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminApplicationService.exportAllApplicationsCsv).mockResolvedValue('');

    await GET(
      new Request(
        'http://localhost/api/admin/applications/export?merchantId=m1&jobPostId=jp1&jobPostTitle=pha+che&importStatus=imported&appliedFrom=2026-01-01&appliedTo=2026-01-31'
      )
    );

    expect(adminApplicationService.exportAllApplicationsCsv).toHaveBeenCalledWith({
      merchantId: 'm1',
      jobPostId: 'jp1',
      jobPostTitle: 'pha che',
      importStatus: 'imported',
      appliedFrom: '2026-01-01',
      appliedTo: '2026-01-31',
    });
  });
});
