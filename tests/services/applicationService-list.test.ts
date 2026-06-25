import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: { application: { findMany: vi.fn(), count: vi.fn() } },
}));

import { listApplications, exportApplicationsCsv } from '@/lib/services/applicationService';
import { prisma } from '@/lib/db/prisma';

describe('applicationService.listApplications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('paginates (skip/take) when a page is given', async () => {
    (prisma.application.findMany as any).mockResolvedValue([{ id: 'a1' }]);
    (prisma.application.count as any).mockResolvedValue(15);

    const result = await listApplications('m1', { page: 2 });

    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    );
    expect(result).toEqual({ items: [{ id: 'a1' }], total: 15 });
  });

  it('returns the full unpaginated result when no page is given', async () => {
    (prisma.application.findMany as any).mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);
    (prisma.application.count as any).mockResolvedValue(2);

    await listApplications('m1');

    const call = (prisma.application.findMany as any).mock.calls[0][0];
    expect(call.skip).toBeUndefined();
    expect(call.take).toBeUndefined();
  });

  it('applies jobPostId/importStatus filters to both the list and count queries', async () => {
    (prisma.application.findMany as any).mockResolvedValue([]);
    (prisma.application.count as any).mockResolvedValue(0);

    await listApplications('m1', { jobPostId: 'jp1', importStatus: 'new' });

    const expectedWhere = { jobPost: { merchantId: 'm1' }, jobPostId: 'jp1', importStatus: 'new' };
    expect(prisma.application.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere }));
    expect(prisma.application.count).toHaveBeenCalledWith({ where: expectedWhere });
  });

  it('applies an appliedFrom/appliedTo date range filter on appliedAt, scoped to the merchant', async () => {
    (prisma.application.findMany as any).mockResolvedValue([]);
    (prisma.application.count as any).mockResolvedValue(0);

    await listApplications('m1', { appliedFrom: '2026-01-01', appliedTo: '2026-01-31' });

    const expectedWhere = {
      jobPost: { merchantId: 'm1' },
      appliedAt: { gte: new Date('2026-01-01'), lte: new Date('2026-01-31') },
    };
    expect(prisma.application.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere }));
    expect(prisma.application.count).toHaveBeenCalledWith({ where: expectedWhere });
  });

  it('applies only appliedFrom when appliedTo is omitted', async () => {
    (prisma.application.findMany as any).mockResolvedValue([]);
    (prisma.application.count as any).mockResolvedValue(0);

    await listApplications('m1', { appliedFrom: '2026-01-01' });

    const expectedWhere = { jobPost: { merchantId: 'm1' }, appliedAt: { gte: new Date('2026-01-01') } };
    expect(prisma.application.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere }));
  });

  it('applies a jobPostTitle keyword filter as a case-insensitive contains on jobPost.title, scoped to the merchant', async () => {
    (prisma.application.findMany as any).mockResolvedValue([]);
    (prisma.application.count as any).mockResolvedValue(0);

    await listApplications('m1', { jobPostTitle: 'pha che' });

    const expectedWhere = {
      jobPost: { merchantId: 'm1', title: { contains: 'pha che', mode: 'insensitive' } },
    };
    expect(prisma.application.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere }));
    expect(prisma.application.count).toHaveBeenCalledWith({ where: expectedWhere });
  });
});

describe('applicationService.exportApplicationsCsv', () => {
  beforeEach(() => vi.clearAllMocks());

  it('exports every application, not just one page', async () => {
    (prisma.application.findMany as any).mockResolvedValue([
      {
        applicantName: 'Nguyễn Văn A',
        phoneNumber: '0987654321',
        importStatus: 'new',
        appliedAt: new Date('2026-01-01T00:00:00Z'),
        jobPost: { title: 'Nhân viên pha chế' },
      },
    ]);
    (prisma.application.count as any).mockResolvedValue(1);

    const csv = await exportApplicationsCsv('m1');

    const call = (prisma.application.findMany as any).mock.calls[0][0];
    expect(call.skip).toBeUndefined();
    expect(call.take).toBeUndefined();
    expect(csv).toContain('Nguyễn Văn A,0987654321,Nhân viên pha chế,new,2026-01-01T00:00:00.000Z');
  });
});
