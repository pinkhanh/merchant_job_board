import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShowMore } from '@/components/worker/ui/ShowMore';

describe('ShowMore', () => {
  it('renders the default "Xem thêm" label when not in toggle mode', () => {
    render(<ShowMore onClick={vi.fn()} />);
    expect(screen.getByText('Xem thêm')).toBeInTheDocument();
  });

  it('renders a custom label', () => {
    render(<ShowMore onClick={vi.fn()} label="Tải thêm" />);
    expect(screen.getByText('Tải thêm')).toBeInTheDocument();
  });

  it('shows the collapsed label when expanded is true', () => {
    render(<ShowMore onClick={vi.fn()} expanded label="Xem thêm" expandedLabel="Thu gọn" />);
    expect(screen.getByText('Thu gọn')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ShowMore onClick={onClick} label="Tải thêm" />);
    fireEvent.click(screen.getByText('Tải thêm'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
