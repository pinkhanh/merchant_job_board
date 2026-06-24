// tests/app/jobs-new-page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));

import JobWizardPage from '@/app/merchant/jobs/new/page';

describe('JobWizardPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    global.fetch = vi.fn((url: string) => {
      if (url.startsWith('/api/merchant/stores')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [{ id: 's1', name: 'Trụ Sở Chính' }], total: 1 }),
        });
      }
      if (url === '/api/jobs') {
        return Promise.resolve({ ok: true, json: async () => ({ id: 'jp1' }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }) as any;
  });

  it('loads stores into Step 1', async () => {
    render(<JobWizardPage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Trụ Sở Chính')).toBeInTheDocument();
    });
  });

  it('does not allow submitting Step 1 with no store selected', async () => {
    render(<JobWizardPage />);
    await waitFor(() => screen.getByLabelText('Trụ Sở Chính'));
    fireEvent.click(screen.getByText('Tiếp theo'));
    expect(screen.getByText('Vui lòng chọn ít nhất 1 cửa hàng')).toBeInTheDocument();
  });

  it('shows the store search/filter bar', async () => {
    render(<JobWizardPage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Tìm kiếm')).toBeInTheDocument();
      expect(screen.getByLabelText('Tỉnh/Thành Phố')).toBeInTheDocument();
    });
  });

  it('shows a "Xem thêm" button when there are more stores than the first page', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.startsWith('/api/merchant/stores')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [{ id: 's1', name: 'Trụ Sở Chính' }], total: 11 }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<JobWizardPage />);
    await waitFor(() => {
      expect(screen.getByText('Xem thêm')).toBeInTheDocument();
    });
  });
});
