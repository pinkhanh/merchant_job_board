import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/tests/test-utils';
import AdminJobsNewPage from '@/app/admin/jobs/new/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('AdminJobsNewPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], total: 0 }),
    }) as any;
  });

  it('renders step 1 brand selection on first load', async () => {
    renderWithProviders(<AdminJobsNewPage />);
    await waitFor(() => {
      expect(screen.getAllByText('Chọn thương hiệu').length).toBeGreaterThan(0);
    });
  });

  it('fetches merchants on mount for brand list', async () => {
    renderWithProviders(<AdminJobsNewPage />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/merchants'));
    });
  });
});
