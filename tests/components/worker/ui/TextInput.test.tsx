import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextInput } from '@/components/worker/ui/TextInput';

describe('TextInput', () => {
  it('renders the label and current value', () => {
    render(<TextInput label="Tên vị trí" value="Pha chế" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Tên vị trí')).toHaveValue('Pha chế');
  });

  it('calls onChange with the typed value', () => {
    const onChange = vi.fn();
    render(<TextInput label="Tên vị trí" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Tên vị trí'), { target: { value: 'Thu ngân' } });
    expect(onChange).toHaveBeenCalledWith('Thu ngân');
  });

  it('shows the error message instead of help text when both are given', () => {
    render(<TextInput label="Email" value="" onChange={vi.fn()} error="Email không hợp lệ" helpText="Dùng email công ty" />);
    expect(screen.getByText('Email không hợp lệ')).toBeInTheDocument();
    expect(screen.queryByText('Dùng email công ty')).not.toBeInTheDocument();
  });

  it('is disabled when disabled is true', () => {
    render(<TextInput label="Disabled" value="" onChange={vi.fn()} disabled />);
    expect(screen.getByLabelText('Disabled')).toBeDisabled();
  });
});
