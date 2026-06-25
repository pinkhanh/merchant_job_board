import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Chips } from '@/components/worker/ui/Chips';

describe('Chips', () => {
  it('renders the label', () => {
    render(<Chips label="Theo ca (1)" />);
    expect(screen.getByText('Theo ca (1)')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Chips label="Theo ca" onClick={onClick} />);
    fireEvent.click(screen.getByText('Theo ca'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('calls onRemove without bubbling to onClick when the remove icon is clicked', () => {
    const onClick = vi.fn();
    const onRemove = vi.fn();
    render(<Chips label="Hà Nội" onClick={onClick} onRemove={onRemove} />);
    fireEvent.click(screen.getByLabelText('Xóa Hà Nội'));
    expect(onRemove).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
  });
});
