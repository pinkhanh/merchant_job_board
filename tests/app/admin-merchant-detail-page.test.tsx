import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ToastProvider } from '@/components/Toast';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'm1' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

import AdminMerchantDetailPage from '@/app/admin/merchants/[id]/page';

const merchant = {
  id: 'm1',
  brandName: 'Jollibee Việt Nam',
  description: 'Chuỗi gà rán nổi tiếng',
  hotline: '1900',
  logoUrl: null,
  bannerUrl: null,
  industry: 'F&B',
  status: 'active' as const,
  jobCategories: ['Bán hàng', 'Phục vụ'],
  stores: [
    { id: 's1', name: 'Cửa hàng Quận 1', createdAt: '2023-01-01T00:00:00.000Z' },
    { id: 's2', name: 'Cửa hàng Quận 2', createdAt: '2024-01-01T00:00:00.000Z' },
    { id: 's3', name: 'Cửa hàng Quận 3', createdAt: '2024-02-01T00:00:00.000Z' },
    { id: 's4', name: 'Cửa hàng Quận 4', createdAt: '2024-03-01T00:00:00.000Z' },
  ],
};

function renderPage() {
  return render(
    <ToastProvider>
      <AdminMerchantDetailPage />
    </ToastProvider>
  );
}

describe('AdminMerchantDetailPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => merchant }) as any;
  });

  it('renders the brand name, industry/hotline, and description', async () => {
    renderPage();
    // Brand name appears twice: once in the page header, once in MerchantProfileView.
    await waitFor(() => {
      expect(screen.getAllByText('Jollibee Việt Nam').length).toBeGreaterThan(0);
      expect(screen.getByText('F&B')).toBeInTheDocument();
      expect(screen.getByText('1900')).toBeInTheDocument();
      expect(screen.getByText('Chuỗi gà rán nổi tiếng')).toBeInTheDocument();
    });
  });

  it('does not render sync/business-page action buttons from MerchantProfileView', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Jollibee Việt Nam'));

    expect(screen.queryByText('Đồng bộ lại')).not.toBeInTheDocument();
    expect(screen.queryByText('Xem Business Page')).not.toBeInTheDocument();
  });

  it('renders jobCategories as plain non-interactive tags with no add/remove controls', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Bán hàng')).toBeInTheDocument();
      expect(screen.getByText('Phục vụ')).toBeInTheDocument();
    });

    expect(screen.queryByPlaceholderText('Thêm ngành nghề...')).not.toBeInTheDocument();
    expect(screen.queryByText('Thêm')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Xoá/)).not.toBeInTheDocument();
  });

  it('shows the read-only footer note', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Bạn đang xem thông tin công khai của thương hiệu.')).toBeInTheDocument();
    });
  });

  it('reveals the remaining stores from the already-fetched list when "Xem tất cả cửa hàng" is clicked', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Cửa hàng Quận 1')).toBeInTheDocument();
    });

    expect(screen.queryByText('Cửa hàng Quận 4')).not.toBeInTheDocument();
    expect(screen.getByText('Xem tất cả cửa hàng')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Xem tất cả cửa hàng'));

    await waitFor(() => {
      expect(screen.getByText('Cửa hàng Quận 4')).toBeInTheDocument();
    });

    // No store-search/filter API should be involved for the read-only admin view.
    expect(screen.queryByLabelText('Tìm kiếm')).not.toBeInTheDocument();
  });

  it('tags only the oldest store as "Trụ sở chính"', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Trụ sở chính')).toHaveLength(1);
    });
    expect(screen.getByText('Cửa hàng Quận 1').closest('li')!.textContent).toContain('Trụ sở chính');
  });
});
