import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '@/components/worker/ui/SearchBar';

describe('SearchBar', () => {
  it('renders the placeholder when empty', () => {
    render(<SearchBar value="" onChange={vi.fn()} placeholder="Bạn cần tìm gì ...." />);
    expect(screen.getByPlaceholderText('Bạn cần tìm gì ....')).toBeInTheDocument();
  });

  it('calls onChange with the typed value', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'pha chế' } });
    expect(onChange).toHaveBeenCalledWith('pha chế');
  });

  it('shows a clear button only when there is a value, and clears it on click', () => {
    const onChange = vi.fn();
    render(<SearchBar value="pha chế" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Xóa'));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('does not show a clear button when empty', () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.queryByLabelText('Xóa')).not.toBeInTheDocument();
  });
});
