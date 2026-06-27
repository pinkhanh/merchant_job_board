import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/merchant/dashboard',
  useRouter: () => ({ push: pushMock }),
}));

import { Shell } from '@/components/Shell';

describe('Shell', () => {
  it('highlights the nav item matching the current path', () => {
    render(
      <Shell navItems={[{ href: '/merchant/dashboard', label: 'Dashboard' }, { href: '/merchant/jobs', label: 'Quản lý tin' }]}>
        <p>content</p>
      </Shell>
    );

    expect(screen.getByText('Dashboard').closest('a')).toHaveClass('border-primary');
    expect(screen.getByText('Quản lý tin').closest('a')).not.toHaveClass('border-primary');
  });

  it('renders children inside the main content area', () => {
    render(
      <Shell navItems={[]}>
        <p>page content</p>
      </Shell>
    );
    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('renders the Merchant Job Board logo and brand text in the header', () => {
    render(
      <Shell navItems={[]}>
        <p>content</p>
      </Shell>
    );

    expect(screen.getByAltText('Merchant Job Board')).toHaveAttribute('src', '/logo-momo.png');
    expect(screen.getByText('Merchant Job Board')).toBeInTheDocument();
    expect(screen.queryByText('MoMo Việc Làm')).not.toBeInTheDocument();
  });

  it('applies the secondary text color to the main content area', () => {
    render(
      <Shell navItems={[]}>
        <p>content</p>
      </Shell>
    );

    expect(screen.getByText('content').closest('main')).toHaveClass('text-text-secondary');
  });

  it('renders nav icon when provided', () => {
    render(
      <Shell navItems={[{ href: '/test', label: 'Test', iconName: 'Squares2X2' }]}>
        <div />
      </Shell>
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(document.querySelector('svg')).not.toBeNull();
  });

  it('renders brand info block when brandInfo prop is provided', () => {
    render(
      <Shell navItems={[]} brandInfo={{ name: 'Katinat', logoUrl: null }}>
        <div />
      </Shell>
    );
    expect(screen.getByText('Katinat')).toBeInTheDocument();
  });

  it('does not render brand block when brandInfo is not provided', () => {
    render(
      <Shell navItems={[]}><div /></Shell>
    );
    expect(screen.queryByTestId('brand-info')).not.toBeInTheDocument();
  });
});

describe('Shell account menu / logout', () => {
  beforeEach(() => {
    pushMock.mockClear();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }) as any;
  });

  it('does not show the logout option until the account icon is clicked', () => {
    render(
      <Shell navItems={[]}>
        <p>content</p>
      </Shell>
    );
    expect(screen.queryByText('Đăng xuất')).not.toBeInTheDocument();
  });

  it('shows "Đăng xuất" after clicking the account icon', () => {
    render(
      <Shell navItems={[]}>
        <p>content</p>
      </Shell>
    );
    fireEvent.click(screen.getByLabelText('Tài khoản'));
    expect(screen.getByText('Đăng xuất')).toBeInTheDocument();
  });

  it('calls the logout endpoint and redirects to /login when "Đăng xuất" is clicked', async () => {
    render(
      <Shell navItems={[]}>
        <p>content</p>
      </Shell>
    );
    fireEvent.click(screen.getByLabelText('Tài khoản'));
    fireEvent.click(screen.getByText('Đăng xuất'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
      expect(pushMock).toHaveBeenCalledWith('/login');
    });
  });
});
