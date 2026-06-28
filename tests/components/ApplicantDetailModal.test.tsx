import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ApplicantDetailModal } from '@/components/ApplicantDetailModal';

describe('ApplicantDetailModal', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('shows all application history for the phone number (isAdmin)', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      expect(url).toContain('/api/admin/applications/by-phone');
      expect(url).toContain('phone=0901234567');
      return Promise.resolve({
        ok: true,
        json: async () => ({
          applicantName: 'Nguyen Van A',
          phoneNumber: '0901234567',
          items: [
            {
              id: 'app1',
              jobTitle: 'Nhân viên bán hàng',
              merchantName: 'Katinat',
              appliedAt: '2026-01-15T09:00:00Z',
            },
          ],
        }),
      });
    });

    render(<ApplicantDetailModal phone="0901234567" onClose={vi.fn()} isAdmin />);
    await waitFor(() => screen.getByText('Nguyen Van A'));
    expect(screen.getByText('Nhân viên bán hàng')).toBeInTheDocument();
    expect(screen.getByText('Katinat')).toBeInTheDocument();
    expect(screen.getByText('15/01/2026')).toBeInTheDocument();
  });

  it('calls merchant API when isAdmin is false', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      expect(url).toContain('/api/applications/by-phone');
      return Promise.resolve({
        ok: true,
        json: async () => ({
          applicantName: 'Tran Thi B',
          phoneNumber: '0912345678',
          items: [
            {
              id: 'app2',
              jobTitle: 'Thu ngân',
              merchantName: '',
              appliedAt: '2026-02-10T08:00:00Z',
            },
          ],
        }),
      });
    });

    render(<ApplicantDetailModal phone="0912345678" onClose={vi.fn()} />);
    await waitFor(() => screen.getByText('Tran Thi B'));
    expect(screen.getByText('Thu ngân')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        applicantName: 'Test',
        phoneNumber: '0901234567',
        items: [],
      }),
    });

    const onClose = vi.fn();
    render(<ApplicantDetailModal phone="0901234567" onClose={onClose} isAdmin />);
    await waitFor(() => screen.getByText('Test'));

    const closeBtn = screen.getByRole('button');
    closeBtn.click();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
