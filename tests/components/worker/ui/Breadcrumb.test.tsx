import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumb } from '@/components/worker/ui/Breadcrumb';

const items = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Việc làm', href: '/jobs' },
  { label: 'Nhân viên pha chế' },
];

describe('Breadcrumb', () => {
  it('renders every item label', () => {
    render(<Breadcrumb items={items} />);
    expect(screen.getByText('Trang chủ')).toBeInTheDocument();
    expect(screen.getByText('Việc làm')).toBeInTheDocument();
    expect(screen.getByText('Nhân viên pha chế')).toBeInTheDocument();
  });

  it('renders non-last items with an href as links', () => {
    render(<Breadcrumb items={items} />);
    expect(screen.getByRole('link', { name: 'Việc làm' })).toHaveAttribute('href', '/jobs');
  });

  it('does not render the last item as a link', () => {
    render(<Breadcrumb items={items} />);
    expect(screen.queryByRole('link', { name: 'Nhân viên pha chế' })).not.toBeInTheDocument();
  });
});
