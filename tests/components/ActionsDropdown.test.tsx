import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionsDropdown } from '@/components/ActionsDropdown';

describe('ActionsDropdown', () => {
  it('renders a trigger button', () => {
    render(<ActionsDropdown items={[{ label: 'Tạm dừng', onClick: vi.fn() }]} />);
    expect(screen.getByRole('button', { name: /Hành động/i })).toBeInTheDocument();
  });

  it('opens the menu on click and shows items', () => {
    render(<ActionsDropdown items={[
      { label: 'Tạm dừng', onClick: vi.fn() },
      { label: 'Xoá', onClick: vi.fn(), variant: 'danger' },
    ]} />);
    fireEvent.click(screen.getByRole('button', { name: /Hành động/i }));
    expect(screen.getByText('Tạm dừng')).toBeInTheDocument();
    expect(screen.getByText('Xoá')).toBeInTheDocument();
  });

  it('calls the item onClick and closes the menu', () => {
    const pauseFn = vi.fn();
    render(<ActionsDropdown items={[{ label: 'Tạm dừng', onClick: pauseFn }]} />);
    fireEvent.click(screen.getByRole('button', { name: /Hành động/i }));
    fireEvent.click(screen.getByText('Tạm dừng'));
    expect(pauseFn).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Tạm dừng')).not.toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<ActionsDropdown items={[{ label: 'Tạm dừng', onClick: vi.fn() }]} isLoading />);
    expect(screen.getByRole('button', { name: /Đang xử lý/i })).toBeDisabled();
  });
});
