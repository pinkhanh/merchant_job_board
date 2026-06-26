import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZodError } from 'zod';

vi.mock('@/lib/auth/getSession');

// Factory mock: keeps real error classes so instanceof works in route handlers,
// but replaces service functions with vi.fn().
vi.mock('@/lib/services/adminMerchantService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/services/adminMerchantService')>();
  return {
    ...actual,
    listMerchantAccounts: vi.fn(),
    createMerchantAccount: vi.fn(),
    updateMerchantAccount: vi.fn(),
    deleteMerchantAccount: vi.fn(),
  };
});

import { GET, POST } from '@/app/api/admin/merchants/[id]/accounts/route';
import { PATCH, DELETE } from '@/app/api/admin/merchants/[id]/accounts/[userId]/route';
import { getSession } from '@/lib/auth/getSession';
import * as adminMerchantService from '@/lib/services/adminMerchantService';

const adminSession = { userId: 'u-admin', role: 'admin' as const, merchantId: null };
const merchantSession = { userId: 'u1', role: 'merchant' as const, merchantId: 'm1' };

describe('admin merchant accounts API', () => {
  beforeEach(() => vi.clearAllMocks());

  // GET /accounts
  it('GET returns 401 for non-admin', async () => {
    vi.mocked(getSession).mockResolvedValue(merchantSession);
    const res = await GET(new Request('http://localhost/'), { params: Promise.resolve({ id: 'm1' }) });
    expect(res.status).toBe(401);
  });

  it('GET returns list of accounts', async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    const mockAccounts = [{ id: 'u1', username: 'user1', isActive: true, createdAt: new Date() }];
    vi.mocked(adminMerchantService.listMerchantAccounts).mockResolvedValue(mockAccounts as any);

    const res = await GET(new Request('http://localhost/'), { params: Promise.resolve({ id: 'm1' }) });

    expect(adminMerchantService.listMerchantAccounts).toHaveBeenCalledWith('m1');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0]).not.toHaveProperty('passwordHash');
  });

  // POST /accounts
  it('POST returns 401 for non-admin', async () => {
    vi.mocked(getSession).mockResolvedValue(merchantSession);
    const req = new Request('http://localhost/', { method: 'POST', body: JSON.stringify({ username: 'x', password: 'Pass1234!' }) });
    const res = await POST(req, { params: Promise.resolve({ id: 'm1' }) });
    expect(res.status).toBe(401);
  });

  it('POST creates account and returns 201', async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    const created = { id: 'u2', username: 'newuser', isActive: true, createdAt: new Date() };
    vi.mocked(adminMerchantService.createMerchantAccount).mockResolvedValue(created as any);

    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ username: 'newuser', password: 'Pass1234!' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'm1' }) });

    expect(adminMerchantService.createMerchantAccount).toHaveBeenCalledWith('m1', { username: 'newuser', password: 'Pass1234!' });
    expect(res.status).toBe(201);
  });

  it('POST returns 409 on username conflict', async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(adminMerchantService.createMerchantAccount).mockRejectedValue(
      new adminMerchantService.UsernameConflictError()
    );

    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ username: 'taken', password: 'Pass1234!' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'm1' }) });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('Tên đăng nhập đã tồn tại');
  });

  it('POST returns 400 on ZodError', async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(adminMerchantService.createMerchantAccount).mockRejectedValue(new ZodError([]));

    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ username: 'x', password: 'short' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'm1' }) });
    expect(res.status).toBe(400);
  });

  // PATCH /accounts/[userId]
  it('PATCH returns 401 for non-admin', async () => {
    vi.mocked(getSession).mockResolvedValue(merchantSession);
    const req = new Request('http://localhost/', { method: 'PATCH', body: JSON.stringify({ isActive: false }) });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'm1', userId: 'u1' }) });
    expect(res.status).toBe(401);
  });

  it('PATCH updates account and returns 200', async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(adminMerchantService.updateMerchantAccount).mockResolvedValue(undefined);

    const req = new Request('http://localhost/', {
      method: 'PATCH',
      body: JSON.stringify({ isActive: false }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'm1', userId: 'u1' }) });

    expect(adminMerchantService.updateMerchantAccount).toHaveBeenCalledWith('m1', 'u1', { isActive: false });
    expect(res.status).toBe(200);
  });

  // DELETE /accounts/[userId]
  it('DELETE returns 401 for non-admin', async () => {
    vi.mocked(getSession).mockResolvedValue(merchantSession);
    const req = new Request('http://localhost/', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'm1', userId: 'u1' }) });
    expect(res.status).toBe(401);
  });

  it('DELETE removes account and returns 200', async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(adminMerchantService.deleteMerchantAccount).mockResolvedValue(undefined);

    const req = new Request('http://localhost/', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'm1', userId: 'u1' }) });

    expect(adminMerchantService.deleteMerchantAccount).toHaveBeenCalledWith('m1', 'u1');
    expect(res.status).toBe(200);
  });

  it('DELETE returns 409 when last account', async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(adminMerchantService.deleteMerchantAccount).mockRejectedValue(
      new adminMerchantService.LastAccountError()
    );

    const req = new Request('http://localhost/', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'm1', userId: 'u1' }) });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('Phải có ít nhất 1 tài khoản');
  });
});
