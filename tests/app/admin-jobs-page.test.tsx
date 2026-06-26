// tests/app/admin-jobs-page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/tests/test-utils';

import AdminJobsPage from '@/app/admin/jobs/page';

function jobPost(id: string, title: string, status: string, brandName: string) {
  return { id, title, status, merchant: { brandName } };
}

describe('AdminJobsPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [jobPost('jp1', 'Nhân viên pha chế', 'live', 'Katinat')],
    }) as any;
  });

  it('fetches job posts on initial render and renders the merchant column', async () => {
    renderWithProviders(<AdminJobsPage />);
    await waitFor(() => {
      expect(screen.getByText('Nhân viên pha chế')).toBeInTheDocument();
    });
    expect(screen.getByText('Katinat')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/jobs');
  });

  it('renders a Vietnamese status label instead of the raw status code', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [jobPost('jp2', 'Nhân viên kho', 'expired', 'Cửa hàng ABC')],
    }) as any;

    renderWithProviders(<AdminJobsPage />);

    await waitFor(() => {
      expect(screen.getByText('Hết hạn')).toBeInTheDocument();
    });
    expect(screen.queryByText('expired')).not.toBeInTheDocument();
  });
});
