import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZodError } from 'zod';

vi.mock('@/lib/auth/getSession');
vi.mock('@/lib/services/merchantProfileService');

import { GET, PATCH } from '@/app/api/merchant/profile/route';
import { getSession } from '@/lib/auth/getSession';
import * as profileService from '@/lib/services/merchantProfileService';

describe('merchant profile API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET returns the merchant profile', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(profileService.getMerchantProfile).mockResolvedValue({ id: 'm1' } as any);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('PATCH updates the merchant profile', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(profileService.updateMerchantProfile).mockResolvedValue({} as any);

    const req = new Request('http://localhost/api/merchant/profile', {
      method: 'PATCH',
      body: JSON.stringify({ description: 'New' }),
    });
    const res = await PATCH(req);

    expect(profileService.updateMerchantProfile).toHaveBeenCalledWith('m1', { description: 'New' });
    expect(res.status).toBe(200);
  });

  it('PATCH passes jobCategories through to the service', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(profileService.updateMerchantProfile).mockResolvedValue({} as any);

    const req = new Request('http://localhost/api/merchant/profile', {
      method: 'PATCH',
      body: JSON.stringify({ jobCategories: ['Bán hàng', 'Phục vụ'] }),
    });
    const res = await PATCH(req);

    expect(profileService.updateMerchantProfile).toHaveBeenCalledWith('m1', {
      jobCategories: ['Bán hàng', 'Phục vụ'],
    });
    expect(res.status).toBe(200);
  });

  it('GET returns 401 when there is no merchant session', async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('GET returns 401 when session role is not merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('PATCH returns 401 when there is no merchant session', async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const req = new Request('http://localhost/api/merchant/profile', {
      method: 'PATCH',
      body: JSON.stringify({ description: 'New' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it('PATCH returns 401 when session role is not merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });

    const req = new Request('http://localhost/api/merchant/profile', {
      method: 'PATCH',
      body: JSON.stringify({ description: 'New' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it('PATCH returns 400 for a malformed body', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(profileService.updateMerchantProfile).mockImplementation(() => {
      throw new ZodError([
        { code: 'invalid_type', expected: 'string', received: 'number', path: ['description'], message: 'Expected string, received number' },
      ] as any);
    });

    const req = new Request('http://localhost/api/merchant/profile', {
      method: 'PATCH',
      body: JSON.stringify({ description: 123 }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });
});
