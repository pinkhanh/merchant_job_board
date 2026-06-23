import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    application: { findMany: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
    phoneRevealLog: { create: vi.fn() },
  },
}));

import { updateImportStatus, revealPhone, ApplicationNotFoundError } from '@/lib/services/applicationService';
import { prisma } from '@/lib/db/prisma';

describe('applicationService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates the import status of an application scoped to the calling merchant', async () => {
    (prisma.application.findFirst as any).mockResolvedValue({ id: 'app1' });

    await updateImportStatus('app1', 'm1', 'imported');

    expect(prisma.application.findFirst).toHaveBeenCalledWith({
      where: { id: 'app1', jobPost: { merchantId: 'm1' } },
    });
    expect(prisma.application.update).toHaveBeenCalledWith({
      where: { id: 'app1' },
      data: { importStatus: 'imported' },
    });
  });

  it('rejects updating an application that belongs to a different merchant', async () => {
    (prisma.application.findFirst as any).mockResolvedValue(null);

    await expect(updateImportStatus('app1', 'm1', 'imported')).rejects.toBeInstanceOf(ApplicationNotFoundError);
    expect(prisma.application.update).not.toHaveBeenCalled();
  });

  it('reveals a phone number and logs the reveal, scoped to the calling merchant', async () => {
    (prisma.application.findFirst as any).mockResolvedValue({ id: 'app1', phoneNumber: '0987654321' });

    const phone = await revealPhone('app1', 'm1', 'u1');

    expect(phone).toBe('0987654321');
    expect(prisma.application.findFirst).toHaveBeenCalledWith({
      where: { id: 'app1', jobPost: { merchantId: 'm1' } },
    });
    expect(prisma.phoneRevealLog.create).toHaveBeenCalledWith({
      data: { applicationId: 'app1', revealedBy: 'u1' },
    });
  });

  it('rejects revealing a phone number for an application that belongs to a different merchant', async () => {
    (prisma.application.findFirst as any).mockResolvedValue(null);

    await expect(revealPhone('app1', 'm1', 'u1')).rejects.toBeInstanceOf(ApplicationNotFoundError);
    expect(prisma.phoneRevealLog.create).not.toHaveBeenCalled();
  });
});
