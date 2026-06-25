import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

vi.mock('@/lib/auth/getSession');
vi.mock('@/lib/services/adminMerchantService');

import { GET, POST } from '@/app/api/admin/merchants/route';
import { GET as GET_ONE, PATCH } from '@/app/api/admin/merchants/[id]/route';
import { getSession } from '@/lib/auth/getSession';
import * as adminMerchantService from '@/lib/services/adminMerchantService';

function makeP2002Error() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed.', {
    code: 'P2002',
    clientVersion: 'test',
  });
}

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

  it('POST returns 400 when createMerchant rejects with a ZodError', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminMerchantService.createMerchant).mockRejectedValue(new ZodError([]));

    const req = new Request('http://localhost/api/admin/merchants', { method: 'POST', body: JSON.stringify({ brandName: 'x' }) });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST returns 409 when createMerchant rejects with a P2002 duplicate-username error', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminMerchantService.createMerchant).mockRejectedValue(makeP2002Error());

    const req = new Request('http://localhost/api/admin/merchants', { method: 'POST', body: JSON.stringify({ brandName: 'x' }) });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('PATCH toggles merchant status', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminMerchantService.setMerchantStatus).mockResolvedValue({} as any);

    const req = new Request('http://localhost/api/admin/merchants/m1', { method: 'PATCH', body: JSON.stringify({ status: 'inactive' }) });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'm1' }) });

    expect(adminMerchantService.setMerchantStatus).toHaveBeenCalledWith('m1', 'inactive');
    expect(res.status).toBe(200);
  });

  it('GET /:id returns 401 for a non-admin session', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    const res = await GET_ONE(new Request('http://localhost/api/admin/merchants/m1'), { params: Promise.resolve({ id: 'm1' }) });
    expect(res.status).toBe(401);
  });

  it('GET /:id returns 404 when the merchant does not exist', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminMerchantService.getMerchantById).mockResolvedValue(null);

    const res = await GET_ONE(new Request('http://localhost/api/admin/merchants/missing'), { params: Promise.resolve({ id: 'missing' }) });
    expect(res.status).toBe(404);
  });

  it('GET /:id returns the merchant with its stores for an admin session', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminMerchantService.getMerchantById).mockResolvedValue({
      id: 'm1',
      brandName: 'Jollibee',
      stores: [{ id: 's1', name: 'Cửa hàng Quận 1' }],
    } as any);

    const res = await GET_ONE(new Request('http://localhost/api/admin/merchants/m1'), { params: Promise.resolve({ id: 'm1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      id: 'm1',
      brandName: 'Jollibee',
      stores: [{ id: 's1', name: 'Cửa hàng Quận 1' }],
    });
    expect(adminMerchantService.getMerchantById).toHaveBeenCalledWith('m1');
  });
});
