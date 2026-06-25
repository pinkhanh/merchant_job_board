import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultiSelect } from '@/components/worker/ui/MultiSelect';

const options = [
  { value: 'hcm', label: 'Hồ Chí Minh' },
  { value: 'hn', label: 'Hà Nội' },
];

describe('MultiSelect', () => {
  it('shows the placeholder when no values are selected', () => {
    render(<MultiSelect values={[]} onChange={vi.fn()} options={options} placeholder="Select a value" />);
    expect(screen.getByText('Select a value')).toBeInTheDocument();
  });

  it('renders a removable chip for each selected value', () => {
    render(<MultiSelect values={['hcm']} onChange={vi.fn()} options={options} />);
    expect(screen.getByText('Hồ Chí Minh')).toBeInTheDocument();
  });

  it('opens the option list and adds a value on click', () => {
    const onChange = vi.fn();
    render(<MultiSelect values={[]} onChange={onChange} options={options} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Hà Nội'));
    expect(onChange).toHaveBeenCalledWith(['hn']);
  });

  it('removes a value when its chip is clicked', () => {
    const onChange = vi.fn();
    render(<MultiSelect values={['hcm', 'hn']} onChange={onChange} options={options} />);
    fireEvent.click(screen.getByLabelText('Xóa Hồ Chí Minh'));
    expect(onChange).toHaveBeenCalledWith(['hn']);
  });
});
