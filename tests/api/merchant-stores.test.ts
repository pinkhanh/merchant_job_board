// tests/api/merchant-stores.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/getSession');
vi.mock('@/lib/services/storeService');

import { GET } from '@/app/api/merchant/stores/route';
import { getSession } from '@/lib/auth/getSession';
import { listStores } from '@/lib/services/storeService';

describe('GET /api/merchant/stores', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the { items, total } result for the logged-in merchant, defaulting to page 1', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(listStores).mockResolvedValue({ items: [{ id: 's1' }], total: 1 } as any);

    const res = await GET(new Request('http://localhost/api/merchant/stores'));
    const body = await res.json();

    expect(listStores).toHaveBeenCalledWith('m1', { keyword: undefined, city: undefined, district: undefined, page: 1 });
    expect(body).toEqual({ items: [{ id: 's1' }], total: 1 });
  });

  it('passes keyword/city/district/page query params through', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(listStores).mockResolvedValue({ items: [], total: 0 } as any);

    const req = new Request(
      'http://localhost/api/merchant/stores?keyword=Quan1&city=H%C3%A0%20N%E1%BB%99i&district=C%E1%BA%A7u%20Gi%E1%BA%A5y&page=2'
    );
    await GET(req);

    expect(listStores).toHaveBeenCalledWith('m1', { keyword: 'Quan1', city: 'Hà Nội', district: 'Cầu Giấy', page: 2 });
  });

  it('returns 401 when there is no merchant session', async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const res = await GET(new Request('http://localhost/api/merchant/stores'));
    expect(res.status).toBe(401);
  });

  it('returns 401 when session role is not merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });

    const res = await GET(new Request('http://localhost/api/merchant/stores'));
    expect(res.status).toBe(401);
  });
});
