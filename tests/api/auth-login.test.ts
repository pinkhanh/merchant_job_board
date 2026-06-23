import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/services/authService');

import { POST } from '@/app/api/auth/login/route';
import * as authService from '@/lib/services/authService';

describe('POST /api/auth/login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets a session cookie and returns the role on success', async () => {
    vi.mocked(authService.login).mockResolvedValue({ token: 'fake-token', role: 'merchant' });
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'merchant1', password: 'pw' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.role).toBe('merchant');
    expect(res.headers.get('set-cookie')).toContain('session=fake-token');
  });

  it('returns 401 for invalid credentials', async () => {
    vi.mocked(authService.login).mockRejectedValue(new authService.InvalidCredentialsError());
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'merchant1', password: 'wrong' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 for an inactive account', async () => {
    vi.mocked(authService.login).mockRejectedValue(new authService.InactiveAccountError());
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'merchant1', password: 'pw' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
