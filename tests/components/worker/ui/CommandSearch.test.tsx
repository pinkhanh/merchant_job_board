import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandSearch } from '@/components/worker/ui/CommandSearch';

const options = [
  { value: 'hcm', label: 'Hồ Chí Minh' },
  { value: 'dl', label: 'Đà Lạt' },
];

describe('CommandSearch', () => {
  it('renders every option when the query is empty', () => {
    render(<CommandSearch query="" onQueryChange={vi.fn()} options={options} onSelect={vi.fn()} />);
    expect(screen.getByText('Hồ Chí Minh')).toBeInTheDocument();
    expect(screen.getByText('Đà Lạt')).toBeInTheDocument();
  });

  it('filters options by the query, case-insensitively', () => {
    render(<CommandSearch query="đà" onQueryChange={vi.fn()} options={options} onSelect={vi.fn()} />);
    expect(screen.queryByText('Hồ Chí Minh')).not.toBeInTheDocument();
    expect(screen.getByText('Đà Lạt')).toBeInTheDocument();
  });

  it('calls onQueryChange when typing', () => {
    const onQueryChange = vi.fn();
    render(<CommandSearch query="" onQueryChange={onQueryChange} options={options} onSelect={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hcm' } });
    expect(onQueryChange).toHaveBeenCalledWith('hcm');
  });

  it('calls onSelect with the clicked option value', () => {
    const onSelect = vi.fn();
    render(<CommandSearch query="" onQueryChange={vi.fn()} options={options} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Đà Lạt'));
    expect(onSelect).toHaveBeenCalledWith('dl');
  });
});
