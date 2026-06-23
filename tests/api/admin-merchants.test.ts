import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/getSession');
vi.mock('@/lib/services/adminMerchantService');

import { GET, POST } from '@/app/api/admin/merchants/route';
import { PATCH } from '@/app/api/admin/merchants/[id]/route';
import { getSession } from '@/lib/auth/getSession';
import * as adminMerchantService from '@/lib/services/adminMerchantService';

describe('admin merchants API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET returns 401 for a non-admin session', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    const res = await GET(new Request('http://localhost/api/admin/merchants'));
    expect(res.status).toBe(401);
  });

  it('GET lists merchants for an admin session', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminMerchantService.listMerchants).mockResolvedValue([{ id: 'm1' }] as any);

    const res = await GET(new Request('http://localhost/api/admin/merchants'));
    expect(res.status).toBe(200);
  });

  it('POST creates a merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminMerchantService.createMerchant).mockResolvedValue({ merchant: { id: 'm1' }, user: { id: 'u1' } } as any);

    const req = new Request('http://localhost/api/admin/merchants', { method: 'POST', body: JSON.stringify({ brandName: 'x' }) });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('PATCH toggles merchant status', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminMerchantService.setMerchantStatus).mockResolvedValue({} as any);

    const req = new Request('http://localhost/api/admin/merchants/m1', { method: 'PATCH', body: JSON.stringify({ status: 'inactive' }) });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'm1' }) });

    expect(adminMerchantService.setMerchantStatus).toHaveBeenCalledWith('m1', 'inactive');
    expect(res.status).toBe(200);
  });
});
