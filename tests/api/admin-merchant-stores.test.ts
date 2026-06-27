import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/auth/getSession', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/services/storeService', () => ({ listStores: vi.fn() }));

import { getSession } from '@/lib/auth/getSession';
import { listStores } from '@/lib/services/storeService';
import { GET } from '@/app/api/admin/merchants/[id]/stores/route';

function makeReq(url: string) {
  return new Request(url);
}

describe('GET /api/admin/merchants/[id]/stores', () => {
  it('returns 401 if not admin', async () => {
    (getSession as any).mockResolvedValue({ role: 'merchant' });
    const res = await GET(makeReq('http://x/api/admin/merchants/m1/stores'), { params: { id: 'm1' } });
    expect(res.status).toBe(401);
  });

  it('returns store list for admin', async () => {
    (getSession as any).mockResolvedValue({ role: 'admin' });
    (listStores as any).mockResolvedValue({ items: [{ id: 's1', name: 'Store 1' }], total: 1 });
    const res = await GET(makeReq('http://x/api/admin/merchants/m1/stores?page=1'), { params: { id: 'm1' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
  });
});
