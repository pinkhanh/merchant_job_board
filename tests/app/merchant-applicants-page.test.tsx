import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { renderWithProviders } from '@/tests/test-utils';

import ApplicantsPage from '@/app/merchant/applicants/page';

function application(id: string, name: string) {
  return {
    id,
    applicantName: name,
    phoneNumber: '0987654321',
    importStatus: 'new' as const,
    jobPost: { title: 'Nhân viên pha chế' },
  };
}

describe('ApplicantsPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/jobs') && !url.includes('/api/applications')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [{ id: 'jp1', title: 'Nhân viên pha chế' }], total: 1 }),
        });
      }
      if (url.includes('export-logs')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ items: [application('app1', 'Nguyễn Văn A')], total: 18 }),
        blob: async () => new Blob(['csv']),
      });
    }) as any;
  });

  it('fetches page 1 on initial render and renders the items', async () => {
    render(<ApplicantsPage />);
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/applications?page=1');
  });

  it('shows the pagination footer with the total count', async () => {
    render(<ApplicantsPage />);
    await waitFor(() => {
      expect(screen.getByText('Hiển thị 10 trên 18 ứng viên')).toBeInTheDocument();
    });
  });

  it('refetches with the new page when a page button is clicked', async () => {
    render(<ApplicantsPage />);
    await waitFor(() => screen.getByText('Nguyễn Văn A'));

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/applications?page=2');
    });
  });

  it('filters by applicant name when text is entered', async () => {
    render(<ApplicantsPage />);
    await waitFor(() => screen.getByRole('table'));
    fireEvent.change(screen.getByPlaceholderText('Tìm theo tên'), { target: { value: 'Nguyen' } });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('applicantName=Nguyen')
      );
    });
  });

  it('shows apply time column before position column', async () => {
    render(<ApplicantsPage />);
    await waitFor(() => screen.getByRole('table'));
    const headers = screen.getAllByRole('columnheader').map(h => h.textContent);
    const timeIdx = headers.findIndex(h => h?.includes('Thời gian nộp'));
    const posIdx = headers.findIndex(h => h?.includes('Vị trí'));
    expect(timeIdx).toBeGreaterThan(-1);
    expect(timeIdx).toBeLessThan(posIdx);
  });

  it('shows position filter dropdown populated via status=live', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/jobs') && url.includes('status=live')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            items: [
              { id: 'j1', title: 'Nhân viên bán hàng' },
              { id: 'j2', title: 'Bảo vệ' },
            ],
          }),
        });
      }
      if (url.includes('/api/jobs')) {
        return Promise.resolve({ ok: true, json: async () => ({ items: [] }) });
      }
      if (url.includes('export-logs')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ items: [application('app1', 'Nguyễn Văn A')], total: 18 }),
        blob: async () => new Blob(['csv']),
      });
    }) as any;

    render(<ApplicantsPage />);
    await waitFor(() => screen.getByRole('combobox', { name: /Vị trí/i }));
    const select = screen.getByRole('combobox', { name: /Vị trí/i });
    expect(select).toHaveAttribute('aria-label', 'Vị trí');
    expect(screen.getByRole('option', { name: 'Nhân viên bán hàng' })).toBeInTheDocument();
  });

  it('shows apply date range inputs with aria-labels', async () => {
    render(<ApplicantsPage />);
    await waitFor(() => screen.getByRole('table'));
    const fromInput = screen.getByLabelText('Từ ngày');
    const toInput = screen.getByLabelText('Đến ngày');
    expect(fromInput).toHaveAttribute('aria-label', 'Từ ngày');
    expect(toInput).toHaveAttribute('aria-label', 'Đến ngày');
  });

  it('shows CSV export history block', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('export-logs')) return Promise.resolve({
        ok: true,
        json: async () => [{ id: 'log1', fileName: 'ung-vien-2026-06-27.csv', exportedAt: '2026-06-27T10:00:00Z', applicantCount: 12 }],
      });
      return Promise.resolve({ ok: true, json: async () => ({ items: [], total: 0 }) });
    }) as any;

    renderWithProviders(<ApplicantsPage />);
    await waitFor(() => {
      expect(screen.getByText('Lịch sử xuất CSV')).toBeInTheDocument();
      expect(screen.getByText('ung-vien-2026-06-27.csv')).toBeInTheDocument();
      expect(screen.getByText('12 ứng viên')).toBeInTheDocument();
    });
  });
});
