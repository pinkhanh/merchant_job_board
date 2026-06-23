import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/getSession');
vi.mock('@/lib/services/storeService');

import { GET } from '@/app/api/merchant/stores/route';
import { getSession } from '@/lib/auth/getSession';
import { listStores } from '@/lib/services/storeService';

describe('GET /api/merchant/stores', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the stores for the logged-in merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(listStores).mockResolvedValue([{ id: 's1' } as any]);

    const res = await GET();
    const body = await res.json();

    expect(listStores).toHaveBeenCalledWith('m1');
    expect(body).toEqual([{ id: 's1' }]);
  });

  it('returns 401 when there is no merchant session', async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });
});
