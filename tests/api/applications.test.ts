import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/getSession');
vi.mock('@/lib/services/applicationService');

import { GET } from '@/app/api/applications/route';
import { PATCH } from '@/app/api/applications/[id]/route';
import { POST as revealPhonePOST } from '@/app/api/applications/[id]/reveal-phone/route';
import { getSession } from '@/lib/auth/getSession';
import * as applicationService from '@/lib/services/applicationService';

describe('applications API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET lists applications for the logged-in merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(applicationService.listApplications).mockResolvedValue([{ id: 'app1' }] as any);

    const res = await GET(new Request('http://localhost/api/applications'));
    expect(applicationService.listApplications).toHaveBeenCalledWith('m1', {
      jobPostId: undefined,
      importStatus: undefined,
    });
    expect(res.status).toBe(200);
  });

  it('PATCH updates import status, scoped to the calling merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(applicationService.updateImportStatus).mockResolvedValue({} as any);

    const req = new Request('http://localhost/api/applications/app1', {
      method: 'PATCH',
      body: JSON.stringify({ importStatus: 'imported' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'app1' }) });

    expect(applicationService.updateImportStatus).toHaveBeenCalledWith('app1', 'm1', 'imported');
    expect(res.status).toBe(200);
  });

  it('PATCH returns 404 when the application belongs to a different merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(applicationService.updateImportStatus).mockRejectedValue(
      new applicationService.ApplicationNotFoundError()
    );

    const req = new Request('http://localhost/api/applications/app1', {
      method: 'PATCH',
      body: JSON.stringify({ importStatus: 'imported' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'app1' }) });

    expect(res.status).toBe(404);
  });

  it('POST reveal-phone returns the phone number, scoped to the calling merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(applicationService.revealPhone).mockResolvedValue('0987654321');

    const res = await revealPhonePOST(new Request('http://localhost'), { params: Promise.resolve({ id: 'app1' }) });
    const body = await res.json();

    expect(applicationService.revealPhone).toHaveBeenCalledWith('app1', 'm1', 'u1');
    expect(body.phoneNumber).toBe('0987654321');
  });

  it('POST reveal-phone returns 404 when the application belongs to a different merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(applicationService.revealPhone).mockRejectedValue(new applicationService.ApplicationNotFoundError());

    const res = await revealPhonePOST(new Request('http://localhost'), { params: Promise.resolve({ id: 'app1' }) });
    expect(res.status).toBe(404);
  });
});
