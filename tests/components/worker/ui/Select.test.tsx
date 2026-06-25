import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from '@/components/worker/ui/Select';

const options = [
  { value: '', label: 'Tất cả' },
  { value: 'F&B', label: 'F&B' },
];

describe('Select', () => {
  it('renders the label and options', () => {
    render(<Select label="Ngành nghề" value="" onChange={vi.fn()} options={options} />);
    expect(screen.getByText('Ngành nghề')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'F&B' })).toBeInTheDocument();
  });

  it('calls onChange with the selected value', () => {
    const onChange = vi.fn();
    render(<Select value="" onChange={onChange} options={options} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'F&B' } });
    expect(onChange).toHaveBeenCalledWith('F&B');
  });

  it('shows the error message instead of help text when both are given', () => {
    render(<Select value="" onChange={vi.fn()} options={options} error="Bắt buộc chọn" helpText="Chọn 1 ngành" />);
    expect(screen.getByText('Bắt buộc chọn')).toBeInTheDocument();
    expect(screen.queryByText('Chọn 1 ngành')).not.toBeInTheDocument();
  });
});
