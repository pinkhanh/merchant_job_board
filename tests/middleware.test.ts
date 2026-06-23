// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { createSessionToken } from '@/lib/auth/session';

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-key-for-vitest-only';
});

function requestFor(path: string, cookie?: string) {
  const req = new NextRequest(new URL(`http://localhost${path}`));
  if (cookie) req.cookies.set('session', cookie);
  return req;
}

describe('middleware', () => {
  it('redirects to /login when there is no session cookie', async () => {
    const res = await middleware(requestFor('/merchant/dashboard'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('allows a merchant session into /merchant routes', async () => {
    const token = await createSessionToken({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    const res = await middleware(requestFor('/merchant/dashboard', token));
    expect(res.status).toBe(200);
  });

  it('blocks a merchant session from /admin routes', async () => {
    const token = await createSessionToken({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    const res = await middleware(requestFor('/admin/merchants', token));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('allows an admin session into /admin routes', async () => {
    const token = await createSessionToken({ userId: 'u2', role: 'admin', merchantId: null });
    const res = await middleware(requestFor('/admin/merchants', token));
    expect(res.status).toBe(200);
  });
});
