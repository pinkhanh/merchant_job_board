import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: { application: { findMany: vi.fn() } },
}));

import { listAllApplications, exportAllApplicationsCsv } from '@/lib/services/adminApplicationService';
import { prisma } from '@/lib/db/prisma';

describe('adminApplicationService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('never includes phoneNumber even if Prisma returns it', async () => {
    (prisma.application.findMany as any).mockResolvedValue([
      { id: 'app1', applicantName: 'Nguyen Van A', phoneNumber: '0987654321', importStatus: 'new', jobPost: { title: 'Thu ngân' } },
    ]);

    const result = await listAllApplications({});

    expect(result[0]).not.toHaveProperty('phoneNumber');
    expect(result[0]).toMatchObject({ id: 'app1', applicantName: 'Nguyen Van A' });
  });

  it('CSV export never includes a phone column or value', async () => {
    (prisma.application.findMany as any).mockResolvedValue([
      { id: 'app1', applicantName: 'Nguyen Van A', phoneNumber: '0987654321', importStatus: 'new', jobPost: { title: 'Thu ngân' } },
    ]);

    const csv = await exportAllApplicationsCsv({});

    expect(csv).not.toContain('0987654321');
    expect(csv.split('\n')[0]).toBe('name,job_post,import_status,applied_at');
  });
});
