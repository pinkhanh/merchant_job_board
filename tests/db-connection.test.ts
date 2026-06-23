import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/db/prisma';

describe('database connection', () => {
  it('connects and can query the merchants table', async () => {
    const count = await prisma.merchant.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
