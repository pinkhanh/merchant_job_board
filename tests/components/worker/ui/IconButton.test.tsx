import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { IconButton } from '@/components/worker/ui/IconButton';

describe('IconButton', () => {
  it('renders with the given aria-label', () => {
    render(<IconButton icon={<PlusIcon />} ariaLabel="Thêm" onClick={vi.fn()} />);
    expect(screen.getByLabelText('Thêm')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<IconButton icon={<PlusIcon />} ariaLabel="Thêm" onClick={onClick} />);
    fireEvent.click(screen.getByLabelText('Thêm'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled is true', () => {
    render(<IconButton icon={<PlusIcon />} ariaLabel="Thêm" disabled />);
    expect(screen.getByLabelText('Thêm')).toBeDisabled();
  });
});
