// tests/app/merchant-profile-page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import MerchantProfilePage from '@/app/merchant/profile/page';

describe('MerchantProfilePage', () => {
  beforeEach(() => {
    global.fetch = vi.fn((url: string) => {
      if (url === '/api/merchant/profile') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ brandName: 'Jollibee Việt Nam', description: 'Mô tả', hotline: '1900' }),
        });
      }
      if (url.startsWith('/api/merchant/stores')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [{ id: 's1', name: 'Cửa hàng Quận 1' }], total: 1 }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }) as any;
  });

  it('renders the brand name and the store list', async () => {
    render(<MerchantProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('Jollibee Việt Nam')).toBeInTheDocument();
      expect(screen.getByText('Cửa hàng Quận 1')).toBeInTheDocument();
    });
  });

  it('shows the store search/filter bar', async () => {
    render(<MerchantProfilePage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Tìm kiếm')).toBeInTheDocument();
      expect(screen.getByLabelText('Tỉnh/Thành Phố')).toBeInTheDocument();
      expect(screen.getByLabelText('Quận/Huyện')).toBeInTheDocument();
    });
  });

  it('shows a "Xem thêm" button when there are more stores than the first page', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/merchant/profile') {
        return Promise.resolve({ ok: true, json: async () => ({ brandName: 'Jollibee', description: '', hotline: '' }) });
      }
      if (url.startsWith('/api/merchant/stores')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [{ id: 's1', name: 'Cửa hàng Quận 1' }], total: 11 }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<MerchantProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('Xem thêm')).toBeInTheDocument();
    });
  });
});
