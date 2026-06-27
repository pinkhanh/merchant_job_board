import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCreate, mockFindMany } = vi.hoisted(() => ({
  mockCreate: vi.fn().mockResolvedValue({ id: 'log1', applicantCount: 5 }),
  mockFindMany: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: { csvExportLog: { create: mockCreate, findMany: mockFindMany } },
}));

import { createExportLog, listExportLogs } from '@/lib/services/csvExportLogService';

describe('csvExportLogService', () => {
  beforeEach(() => { mockCreate.mockClear(); mockFindMany.mockClear(); });

  it('createExportLog calls prisma.create with correct data', async () => {
    await createExportLog({ userId: 'u1', applicantCount: 5, fileName: 'export.csv', filters: {} });
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ exportedBy: 'u1', applicantCount: 5, fileName: 'export.csv' }),
    });
  });

  it('listExportLogs queries by exportedBy user', async () => {
    await listExportLogs({ userId: 'u1' });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ exportedBy: 'u1' }) })
    );
  });
});
