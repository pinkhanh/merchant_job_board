// tests/app/admin-jobs-page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/tests/test-utils';

import AdminJobsPage from '@/app/admin/jobs/page';

function jobPost(id: string, title: string, status: string, brandName: string) {
  return {
    id,
    title,
    status,
    deadline: new Date(Date.now() + 86400000 * 30).toISOString(),
    employmentType: 'full_time',
    merchant: { brandName },
    jobPostStores: [{ store: { name: 'Store 1' } }],
  };
}

function setupFetch(posts: ReturnType<typeof jobPost>[]) {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/api/admin/merchants')) {
      return Promise.resolve({ ok: true, json: async () => [] });
    }
    return Promise.resolve({ ok: true, json: async () => posts });
  }) as any;
}

describe('AdminJobsPage', () => {
  beforeEach(() => {
    setupFetch([jobPost('jp1', 'Nhân viên pha chế', 'live', 'Katinat')]);
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
    setupFetch([jobPost('jp2', 'Nhân viên kho', 'expired', 'Cửa hàng ABC')]);

    renderWithProviders(<AdminJobsPage />);

    await waitFor(() => {
      expect(screen.getByText('Hết hạn')).toBeInTheDocument();
    });
    expect(screen.queryByText('expired')).not.toBeInTheDocument();
  });
});
