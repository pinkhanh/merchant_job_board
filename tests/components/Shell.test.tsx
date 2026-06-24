import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({ usePathname: () => '/merchant/dashboard' }));

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
});
