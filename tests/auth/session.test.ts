/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { createSessionToken, verifySessionToken } from '@/lib/auth/session';

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-key-for-vitest-only';
});

describe('session token', () => {
  it('creates a token that verifies back to the same payload', async () => {
    const token = await createSessionToken({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    const payload = await verifySessionToken(token);
    expect(payload).toMatchObject({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
  });

  it('returns null for a tampered token', async () => {
    const token = await createSessionToken({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    const tampered = token.slice(0, -2) + 'xx';
    expect(await verifySessionToken(tampered)).toBeNull();
  });
});
