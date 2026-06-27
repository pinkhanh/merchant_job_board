import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/tests/test-utils';

import AdminApplicantsPage from '@/app/admin/applicants/page';

function application(id: string, name: string, brandName: string) {
  return {
    id,
    applicantName: name,
    maskedPhone: '09••••••21',
    importStatus: 'new',
    jobPost: { title: 'Nhân viên pha chế', merchant: { brandName }, jobPostStores: [] },
  };
}

describe('AdminApplicantsPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/admin/jobs') {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'jp1', title: 'Nhân viên pha chế' }],
        });
      }
      if (url === '/api/admin/merchants') {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'm1', brandName: 'Cửa hàng ABC' }],
        });
      }
      if (url.includes('export-logs')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [application('app1', 'Nguyễn Văn A', 'Cửa hàng ABC')],
        blob: async () => new Blob(['csv']),
      });
    }) as any;
  });

  it('fetches applications on initial render and renders the brand and position columns', async () => {
    render(<AdminApplicantsPage />);
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Cửa hàng ABC').length).toBeGreaterThan(0);
    expect(screen.getByText('Thương hiệu')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/applications');
  });

  it('shows store count for multi-store jobs', async () => {
    const multiStoreApp = {
      id: 'app1',
      applicantName: 'Nguyen Van A',
      maskedPhone: '09••••••67',
      importStatus: 'new',
      jobPost: {
        title: 'Nhân viên bán hàng',
        merchant: { brandName: 'Katinat' },
        jobPostStores: [
          { store: { name: 'Katinat Q1' } },
          { store: { name: 'Katinat Q3' } },
        ],
      },
    };
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/admin/jobs')) return Promise.resolve({ ok: true, json: async () => [] });
      if (url.includes('/api/admin/merchants')) return Promise.resolve({ ok: true, json: async () => [] });
      if (url.includes('export-logs')) return Promise.resolve({ ok: true, json: async () => [] });
      return Promise.resolve({ ok: true, json: async () => [multiStoreApp] });
    }) as any;

    renderWithProviders(<AdminApplicantsPage />);
    await waitFor(() => {
      expect(screen.getByText('2 cửa hàng')).toBeInTheDocument();
    });
  });

  it('filters by applicant name when text is entered', async () => {
    render(<AdminApplicantsPage />);
    await waitFor(() => screen.getByRole('table'));
    fireEvent.change(screen.getByPlaceholderText('Tìm theo tên'), { target: { value: 'Nguyen' } });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('applicantName=Nguyen')
      );
    });
  });

  it('shows apply time column before position column', async () => {
    render(<AdminApplicantsPage />);
    await waitFor(() => screen.getByRole('table'));
    const headers = screen.getAllByRole('columnheader').map(h => h.textContent);
    const timeIdx = headers.findIndex(h => h?.includes('Thời gian nộp'));
    const posIdx = headers.findIndex(h => h?.includes('Vị trí'));
    expect(timeIdx).toBeGreaterThan(-1);
    expect(timeIdx).toBeLessThan(posIdx);
  });

  it('shows CSV export history block', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('export-logs')) return Promise.resolve({
        ok: true,
        json: async () => [{ id: 'log1', fileName: 'ung-vien-2026-06-27.csv', exportedAt: '2026-06-27T10:00:00Z', applicantCount: 5 }],
      });
      if (url.includes('/api/admin/jobs')) return Promise.resolve({ ok: true, json: async () => [] });
      if (url.includes('/api/admin/merchants')) return Promise.resolve({ ok: true, json: async () => [] });
      return Promise.resolve({ ok: true, json: async () => [] });
    }) as any;

    render(<AdminApplicantsPage />);
    await waitFor(() => {
      expect(screen.getByText('Lịch sử xuất CSV')).toBeInTheDocument();
      expect(screen.getByText('ung-vien-2026-06-27.csv')).toBeInTheDocument();
      expect(screen.getByText('5 ứng viên')).toBeInTheDocument();
    });
  });
});
