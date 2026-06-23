import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/services/applicationService');

import { POST } from '@/app/api/applications/route';
import { createApplication, DuplicateApplicationError } from '@/lib/services/applicationService';
import { ZodError, z } from 'zod';

describe('POST /api/applications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates an application with no auth required', async () => {
    vi.mocked(createApplication).mockResolvedValue({ id: 'app1' } as any);
    const req = new Request('http://localhost/api/applications', {
      method: 'POST',
      body: JSON.stringify({ jobPostId: 'jp1', applicantName: 'A', phoneNumber: '0987654321' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('returns 409 on a duplicate application', async () => {
    vi.mocked(createApplication).mockRejectedValue(new DuplicateApplicationError());
    const req = new Request('http://localhost/api/applications', { method: 'POST', body: JSON.stringify({}) });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('returns 400 on invalid input', async () => {
    vi.mocked(createApplication).mockRejectedValue(new ZodError([]));
    const req = new Request('http://localhost/api/applications', { method: 'POST', body: JSON.stringify({}) });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
