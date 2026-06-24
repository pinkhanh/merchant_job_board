// tests/app/merchant-jobs-page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

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
    render(<ManageJobPostsPage />);
    await waitFor(() => {
      expect(screen.getByText('Nhân viên pha chế')).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/jobs?page=1');
  });

  it('shows the pagination footer with the total count', async () => {
    render(<ManageJobPostsPage />);
    await waitFor(() => {
      expect(screen.getByText('Hiển thị 10 trên 25 tin')).toBeInTheDocument();
    });
  });

  it('refetches with the new page when a page button is clicked', async () => {
    render(<ManageJobPostsPage />);
    await waitFor(() => screen.getByText('Nhân viên pha chế'));

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs?page=2');
    });
  });
});
