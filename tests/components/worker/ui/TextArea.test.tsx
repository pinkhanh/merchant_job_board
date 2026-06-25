import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextArea } from '@/components/worker/ui/TextArea';

describe('TextArea', () => {
  it('renders the label and current value', () => {
    render(<TextArea label="Mô tả" value="Dù cho mưa sương" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Mô tả')).toHaveValue('Dù cho mưa sương');
  });

  it('calls onChange with the typed value', () => {
    const onChange = vi.fn();
    render(<TextArea label="Mô tả" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Mô tả'), { target: { value: 'cuộc đời' } });
    expect(onChange).toHaveBeenCalledWith('cuộc đời');
  });

  it('shows the error message instead of help text when both are given', () => {
    render(<TextArea label="Mô tả" value="" onChange={vi.fn()} error="Bắt buộc" helpText="Tối đa 500 ký tự" />);
    expect(screen.getByText('Bắt buộc')).toBeInTheDocument();
    expect(screen.queryByText('Tối đa 500 ký tự')).not.toBeInTheDocument();
  });
});
