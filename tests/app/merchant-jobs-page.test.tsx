// tests/app/merchant-jobs-page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/tests/test-utils';

import ManageJobPostsPage from '@/app/merchant/jobs/page';

function jobPost(id: string, title: string, stores: { store: { name: string } }[] = []) {
  return { id, title, status: 'live', deadline: '2026-12-31T12:00:00.000Z', employmentType: 'shift', jobPostStores: stores };
}

function makeFetch(items = [jobPost('jp1', 'Nhân viên pha chế')], total = 25) {
  return vi.fn().mockImplementation((url: string) => {
    if (String(url).includes('/api/merchant/stores')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ items: [{ id: 's1', name: 'Cửa hàng 1' }] }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({ items, total }),
    });
  });
}

describe('ManageJobPostsPage', () => {
  beforeEach(() => {
    global.fetch = makeFetch() as any;
  });

  it('fetches page 1 on initial render and renders the items', async () => {
    renderWithProviders(<ManageJobPostsPage />);
    await waitFor(() => {
      expect(screen.getByText('Nhân viên pha chế')).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/jobs?page=1');
  });

  it('links the job title to its detail page', async () => {
    renderWithProviders(<ManageJobPostsPage />);
    await waitFor(() => screen.getByText('Nhân viên pha chế'));
    expect(screen.getByRole('link', { name: 'Nhân viên pha chế' })).toHaveAttribute(
      'href',
      '/merchant/jobs/jp1'
    );
  });

  it('shows the pagination footer with the total count', async () => {
    renderWithProviders(<ManageJobPostsPage />);
    await waitFor(() => {
      expect(screen.getByText('Hiển thị 10 trên 25 tin')).toBeInTheDocument();
    });
  });

  it('refetches with the new page when a page button is clicked', async () => {
    renderWithProviders(<ManageJobPostsPage />);
    await waitFor(() => screen.getByText('Nhân viên pha chế'));

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs?page=2');
    });
  });

  it('renders a Vietnamese status label instead of the raw status code', async () => {
    global.fetch = makeFetch([{ ...jobPost('jp2', 'Nhân viên kho'), status: 'paused' }], 1) as any;

    renderWithProviders(<ManageJobPostsPage />);

    await waitFor(() => {
      expect(screen.getByText('Tạm dừng')).toBeInTheDocument();
    });
    expect(screen.queryByText('paused')).not.toBeInTheDocument();
  });

  it('shows single store name in Địa điểm column for single-store jobs', async () => {
    global.fetch = makeFetch(
      [jobPost('jp3', 'Nhân viên pha chế', [{ store: { name: 'Katinat Q1' } }])],
      1
    ) as any;

    renderWithProviders(<ManageJobPostsPage />);

    await waitFor(() => {
      expect(screen.getByText('Katinat Q1')).toBeInTheDocument();
    });
  });

  it('shows "2 cửa hàng" in Địa điểm column for multi-store jobs', async () => {
    global.fetch = makeFetch(
      [
        jobPost('jp4', 'Nhân viên pha chế', [
          { store: { name: 'Katinat Q1' } },
          { store: { name: 'Katinat Q3' } },
        ]),
      ],
      1
    ) as any;

    renderWithProviders(<ManageJobPostsPage />);

    await waitFor(() => {
      expect(screen.getByText('2 cửa hàng')).toBeInTheDocument();
    });
  });

  it('formats the deadline as dd/mm/yyyy', async () => {
    global.fetch = makeFetch(
      [{ ...jobPost('jp5', 'Test Job'), deadline: '2026-06-15T12:00:00.000Z' }],
      1
    ) as any;

    renderWithProviders(<ManageJobPostsPage />);

    await waitFor(() => {
      expect(screen.getByText('15/06/2026')).toBeInTheDocument();
    });
  });

  it('renders filter inputs for date range, employment type, and store', async () => {
    renderWithProviders(<ManageJobPostsPage />);
    expect(screen.getByText('Từ ngày tạo')).toBeInTheDocument();
    expect(screen.getByText('Đến ngày tạo')).toBeInTheDocument();
    expect(screen.getByText('Loại hình')).toBeInTheDocument();
    expect(screen.getByText('Cửa hàng')).toBeInTheDocument();
  });

  it('loads store options from /api/merchant/stores on mount', async () => {
    renderWithProviders(<ManageJobPostsPage />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/merchant/stores?page=1');
    });
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Cửa hàng 1' })).toBeInTheDocument();
    });
  });

  it('refetches with employmentType filter when select changes', async () => {
    renderWithProviders(<ManageJobPostsPage />);
    await waitFor(() => screen.getByText('Nhân viên pha chế'));

    const select = screen.getByRole('combobox', { name: /loại hình/i });
    fireEvent.change(select, { target: { value: 'full_time' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs?page=1&employmentType=full_time');
    });
  });
});
