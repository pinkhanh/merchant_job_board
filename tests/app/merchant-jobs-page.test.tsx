// tests/app/merchant-jobs-page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/tests/test-utils';

import ManageJobPostsPage from '@/app/merchant/jobs/page';

function jobPost(id: string, title: string) {
  return { id, title, status: 'live', deadline: '2026-12-31' };
}

describe('ManageJobPostsPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [jobPost('jp1', 'Nhân viên pha chế')], total: 25 }),
    }) as any;
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
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [{ id: 'jp2', title: 'Nhân viên kho', status: 'paused', deadline: '2026-12-31' }],
        total: 1,
      }),
    }) as any;

    renderWithProviders(<ManageJobPostsPage />);

    await waitFor(() => {
      expect(screen.getByText('Tạm dừng')).toBeInTheDocument();
    });
    expect(screen.queryByText('paused')).not.toBeInTheDocument();
  });
});
