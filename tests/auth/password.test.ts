/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('password hashing', () => {
  it('hashes a password and verifies it matches', async () => {
    const hash = await hashPassword('Sup3rSecret!');
    expect(hash).not.toBe('Sup3rSecret!');
    expect(await verifyPassword('Sup3rSecret!', hash)).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('Sup3rSecret!');
    expect(await verifyPassword('WrongPassword', hash)).toBe(false);
  });
});
