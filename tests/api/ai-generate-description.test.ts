import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/getSession');
vi.mock('@/lib/services/aiService');

import { POST } from '@/app/api/ai/generate-description/route';
import { getSession } from '@/lib/auth/getSession';
import { generateDescription } from '@/lib/services/aiService';

describe('POST /api/ai/generate-description', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns generated description for a logged-in merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(generateDescription).mockResolvedValue({ roleOverview: 'A', requirements: 'B', benefits: 'C' });

    const req = new Request('http://localhost/api/ai/generate-description', {
      method: 'POST',
      body: JSON.stringify({ title: 'Thu ngân', industry: 'Retail', employmentType: 'part_time' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ roleOverview: 'A', requirements: 'B', benefits: 'C' });
  });

  it('returns 401 without a merchant session', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const req = new Request('http://localhost/api/ai/generate-description', { method: 'POST', body: '{}' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when session role is not merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    const req = new Request('http://localhost/api/ai/generate-description', { method: 'POST', body: '{}' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
