// tests/app/merchant-profile-page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/tests/test-utils';

import MerchantProfilePage from '@/app/merchant/profile/page';

function mockFetchWith({
  profile,
  stores,
}: {
  profile: Record<string, unknown>;
  stores: { items: any[]; total: number };
}) {
  global.fetch = vi.fn((url: string) => {
    if (url === '/api/merchant/profile') {
      return Promise.resolve({
        ok: true,
        json: async () => profile,
      });
    }
    if (url.startsWith('/api/merchant/stores')) {
      return Promise.resolve({
        ok: true,
        json: async () => stores,
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  }) as any;
}

describe('MerchantProfilePage', () => {
  beforeEach(() => {
    mockFetchWith({
      profile: { brandName: 'Jollibee Việt Nam', description: 'Mô tả', hotline: '1900' },
      stores: { items: [{ id: 's1', name: 'Cửa hàng Quận 1' }], total: 1 },
    });
  });

  it('renders the brand name and the store list', async () => {
    renderWithProviders(<MerchantProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('Jollibee Việt Nam')).toBeInTheDocument();
      expect(screen.getByText('Cửa hàng Quận 1')).toBeInTheDocument();
    });
  });

  it('shows the store search/filter bar after expanding "Xem tất cả cửa hàng"', async () => {
    renderWithProviders(<MerchantProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('Xem tất cả cửa hàng')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Xem tất cả cửa hàng'));

    await waitFor(() => {
      expect(screen.getByLabelText('Tìm kiếm')).toBeInTheDocument();
      expect(screen.getByLabelText('Tỉnh/Thành Phố')).toBeInTheDocument();
      expect(screen.getByLabelText('Quận/Huyện')).toBeInTheDocument();
    });
  });

  it('shows a "Xem thêm" button when there are more stores than the first page, after expanding the full list', async () => {
    mockFetchWith({
      profile: { brandName: 'Jollibee', description: '', hotline: '' },
      stores: { items: [{ id: 's1', name: 'Cửa hàng Quận 1' }], total: 11 },
    });

    renderWithProviders(<MerchantProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('Xem tất cả cửa hàng')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Xem tất cả cửa hàng'));

    await waitFor(() => {
      expect(screen.getByText('Xem thêm')).toBeInTheDocument();
    });
  });

  it('renders the banner image when bannerUrl is set, and a placeholder when it is null', async () => {
    mockFetchWith({
      profile: {
        brandName: 'Jollibee',
        description: '',
        hotline: '',
        bannerUrl: 'https://cdn.example.com/banner.png',
      },
      stores: { items: [], total: 0 },
    });

    renderWithProviders(<MerchantProfilePage />);
    await waitFor(() => {
      const banner = screen.getByAltText('Ảnh bìa thương hiệu') as HTMLImageElement;
      expect(banner.src).toBe('https://cdn.example.com/banner.png');
    });
    expect(screen.queryByTestId('banner-placeholder')).not.toBeInTheDocument();
  });

  it('renders a banner placeholder when bannerUrl is null', async () => {
    mockFetchWith({
      profile: { brandName: 'Jollibee', description: '', hotline: '', bannerUrl: null },
      stores: { items: [], total: 0 },
    });

    renderWithProviders(<MerchantProfilePage />);
    await waitFor(() => {
      expect(screen.getByTestId('banner-placeholder')).toBeInTheDocument();
    });
  });

  it('renders the logo image when logoUrl is set, and a placeholder when it is null', async () => {
    mockFetchWith({
      profile: {
        brandName: 'Jollibee',
        description: '',
        hotline: '',
        logoUrl: 'https://cdn.example.com/logo.png',
      },
      stores: { items: [], total: 0 },
    });

    renderWithProviders(<MerchantProfilePage />);
    await waitFor(() => {
      const logo = screen.getByAltText('Logo Jollibee') as HTMLImageElement;
      expect(logo.src).toBe('https://cdn.example.com/logo.png');
    });
    expect(screen.queryByTestId('logo-placeholder')).not.toBeInTheDocument();
  });

  it('renders a logo placeholder when logoUrl is null', async () => {
    mockFetchWith({
      profile: { brandName: 'Jollibee', description: '', hotline: '', logoUrl: null },
      stores: { items: [], total: 0 },
    });

    renderWithProviders(<MerchantProfilePage />);
    await waitFor(() => {
      expect(screen.getByTestId('logo-placeholder')).toBeInTheDocument();
    });
  });

  it('tags only the oldest (first-created) store as "Trụ sở chính"', async () => {
    mockFetchWith({
      profile: { brandName: 'Jollibee', description: '', hotline: '' },
      stores: {
        items: [
          { id: 's-newer', name: 'Cửa hàng B', createdAt: '2024-02-01T00:00:00.000Z' },
          { id: 's-oldest', name: 'Cửa hàng A', createdAt: '2023-01-01T00:00:00.000Z' },
          { id: 's-newest', name: 'Cửa hàng C', createdAt: '2024-03-01T00:00:00.000Z' },
        ],
        total: 3,
      },
    });

    renderWithProviders(<MerchantProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Cửa hàng A')).toBeInTheDocument();
    });

    const tags = screen.getAllByText('Trụ sở chính');
    expect(tags).toHaveLength(1);

    const storeRow = screen.getByText('Cửa hàng A').closest('li');
    expect(storeRow).not.toBeNull();
    expect(storeRow!.textContent).toContain('Trụ sở chính');

    expect(screen.getByText('Cửa hàng B').closest('li')!.textContent).not.toContain('Trụ sở chính');
    expect(screen.getByText('Cửa hàng C').closest('li')!.textContent).not.toContain('Trụ sở chính');
  });

  it('renders job category pills and supports adding a new category which persists via PATCH', async () => {
    mockFetchWith({
      profile: { brandName: 'Jollibee', description: '', hotline: '', jobCategories: ['Bán hàng'] },
      stores: { items: [], total: 0 },
    });

    renderWithProviders(<MerchantProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Bán hàng')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Thêm ngành nghề...');
    fireEvent.change(input, { target: { value: 'Phục vụ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Phục vụ')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/merchant/profile',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ jobCategories: ['Bán hàng', 'Phục vụ'] }),
      })
    );
  });

  it('removes a job category pill and persists the removal via PATCH', async () => {
    mockFetchWith({
      profile: { brandName: 'Jollibee', description: '', hotline: '', jobCategories: ['Bán hàng', 'Phục vụ'] },
      stores: { items: [], total: 0 },
    });

    renderWithProviders(<MerchantProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Phục vụ')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Xoá Phục vụ'));

    await waitFor(() => {
      expect(screen.queryByText('Phục vụ')).not.toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/merchant/profile',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ jobCategories: ['Bán hàng'] }),
      })
    );
  });
});
