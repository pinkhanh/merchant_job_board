import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/getSession');
vi.mock('@/lib/services/adminApplicationService');

import { GET } from '@/app/api/admin/applications/route';
import { getSession } from '@/lib/auth/getSession';
import * as adminApplicationService from '@/lib/services/adminApplicationService';

describe('GET /api/admin/applications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns applications without a phoneNumber field', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminApplicationService.listAllApplications).mockResolvedValue([
      {
        id: 'app1',
        applicantName: 'A',
        maskedPhone: '09••••••21',
        importStatus: 'new',
        appliedAt: new Date(),
        jobPost: { title: 'x', merchant: { brandName: 'Merchant X' } },
      },
    ]);

    const res = await GET(new Request('http://localhost/api/admin/applications'));
    const body = await res.json();

    expect(body[0]).not.toHaveProperty('phoneNumber');
  });

  it('returns 401 for a non-admin session', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    const res = await GET(new Request('http://localhost/api/admin/applications'));
    expect(res.status).toBe(401);
  });

  it('passes merchantId, jobPost, importStatus, and applied date range filters through', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminApplicationService.listAllApplications).mockResolvedValue([]);

    await GET(
      new Request(
        'http://localhost/api/admin/applications?merchantId=m1&jobPostId=jp1&jobPostTitle=pha+che&importStatus=imported&appliedFrom=2026-01-01&appliedTo=2026-01-31'
      )
    );

    expect(adminApplicationService.listAllApplications).toHaveBeenCalledWith({
      merchantId: 'm1',
      jobPostId: 'jp1',
      jobPostTitle: 'pha che',
      importStatus: 'imported',
      appliedFrom: '2026-01-01',
      appliedTo: '2026-01-31',
    });
  });
});
