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
      {
        id: 'app1',
        applicantName: 'Nguyen Van A',
        phoneNumber: '0987654321',
        importStatus: 'new',
        jobPost: { title: 'Thu ngân', merchant: { brandName: 'Cửa hàng ABC' } },
      },
    ]);

    const result = await listAllApplications({});

    expect(result[0]).not.toHaveProperty('phoneNumber');
    expect(result[0]).toMatchObject({ id: 'app1', applicantName: 'Nguyen Van A' });
  });

  it('includes the merchant brandName via jobPost.merchant in both the query and the returned shape', async () => {
    (prisma.application.findMany as any).mockResolvedValue([
      {
        id: 'app1',
        applicantName: 'Nguyen Van A',
        phoneNumber: '0987654321',
        importStatus: 'new',
        appliedAt: new Date('2026-01-01T00:00:00Z'),
        jobPost: { title: 'Thu ngân', merchant: { brandName: 'Cửa hàng ABC' } },
      },
    ]);

    const result = await listAllApplications({});

    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          jobPost: {
            select: {
              title: true,
              merchant: { select: { brandName: true } },
              jobPostStores: { select: { store: { select: { name: true } } } },
            },
          },
        },
      })
    );
    expect(result[0].jobPost.merchant.brandName).toBe('Cửa hàng ABC');
  });

  it('applies merchantId, jobPostId, and importStatus filters', async () => {
    (prisma.application.findMany as any).mockResolvedValue([]);

    await listAllApplications({ merchantId: 'm1', jobPostId: 'jp1', importStatus: 'imported' });

    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { jobPostId: 'jp1', importStatus: 'imported', jobPost: { merchantId: 'm1' } },
      })
    );
  });

  it('applies a jobPostTitle keyword filter as a case-insensitive contains on jobPost.title', async () => {
    (prisma.application.findMany as any).mockResolvedValue([]);

    await listAllApplications({ jobPostTitle: 'pha che' });

    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { jobPost: { title: { contains: 'pha che', mode: 'insensitive' } } },
      })
    );
  });

  it('applies an appliedFrom/appliedTo date range filter on appliedAt', async () => {
    (prisma.application.findMany as any).mockResolvedValue([]);

    await listAllApplications({ appliedFrom: '2026-01-01', appliedTo: '2026-01-31' });

    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { appliedAt: { gte: new Date('2026-01-01'), lte: new Date('2026-01-31') } },
      })
    );
  });

  it('applies only appliedFrom when appliedTo is omitted', async () => {
    (prisma.application.findMany as any).mockResolvedValue([]);

    await listAllApplications({ appliedFrom: '2026-01-01' });

    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { appliedAt: { gte: new Date('2026-01-01') } },
      })
    );
  });

  it('CSV export never includes a phone column or value', async () => {
    (prisma.application.findMany as any).mockResolvedValue([
      {
        id: 'app1',
        applicantName: 'Nguyen Van A',
        phoneNumber: '0987654321',
        importStatus: 'new',
        appliedAt: new Date('2026-01-01T00:00:00Z'),
        jobPost: { title: 'Thu ngân', merchant: { brandName: 'Cửa hàng ABC' } },
      },
    ]);

    const csv = await exportAllApplicationsCsv({});

    expect(csv).not.toContain('0987654321');
    expect(csv.split('\n')[0]).toBe('name,merchant,job_post,import_status,applied_at');
  });

  it('includes the merchant brand name as a CSV column value', async () => {
    (prisma.application.findMany as any).mockResolvedValue([
      {
        applicantName: 'Nguyễn Văn A',
        phoneNumber: '0987654321',
        importStatus: 'new',
        appliedAt: new Date('2026-01-01T00:00:00Z'),
        jobPost: { title: 'Nhân viên pha chế', merchant: { brandName: 'Cửa hàng ABC' } },
      },
    ]);

    const csv = await exportAllApplicationsCsv();

    expect(csv).toContain('Nguyễn Văn A,Cửa hàng ABC,Nhân viên pha chế,new,2026-01-01T00:00:00.000Z');
  });
});
