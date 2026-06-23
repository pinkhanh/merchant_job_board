import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({ prisma: { application: { create: vi.fn() } } }));

import { createApplication, DuplicateApplicationError } from '@/lib/services/applicationService';
import { prisma } from '@/lib/db/prisma';

const validInput = {
  jobPostId: '11111111-1111-1111-1111-111111111111',
  applicantName: 'Nguyễn Văn A',
  phoneNumber: '0987654321',
};

describe('applicationService.createApplication', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates an application for a valid VN phone number', async () => {
    (prisma.application.create as any).mockResolvedValue({ id: 'app1', ...validInput });
    const result = await createApplication(validInput);
    expect(result.id).toBe('app1');
    expect(prisma.application.create).toHaveBeenCalledWith({ data: validInput });
  });

  it('rejects a phone number that is not a 10-digit VN number', async () => {
    await expect(createApplication({ ...validInput, phoneNumber: '12345' })).rejects.toThrow();
    expect(prisma.application.create).not.toHaveBeenCalled();
  });

  it('throws DuplicateApplicationError when the phone already applied to this job post', async () => {
    (prisma.application.create as any).mockRejectedValue({ code: 'P2002' });
    await expect(createApplication(validInput)).rejects.toBeInstanceOf(DuplicateApplicationError);
  });
});
