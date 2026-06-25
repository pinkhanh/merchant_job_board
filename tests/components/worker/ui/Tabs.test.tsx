import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from '@/components/worker/ui/Tabs';

const tabs = [
  { value: 'a', label: 'Trái tim MoMo' },
  { value: 'b', label: 'Heo đất MoMo' },
];

describe('Tabs', () => {
  it('renders every tab label', () => {
    render(<Tabs tabs={tabs} value="a" onChange={vi.fn()} />);
    expect(screen.getByText('Trái tim MoMo')).toBeInTheDocument();
    expect(screen.getByText('Heo đất MoMo')).toBeInTheDocument();
  });

  it('marks the active tab with aria-selected', () => {
    render(<Tabs tabs={tabs} value="a" onChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'Trái tim MoMo' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Heo đất MoMo' })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange with the clicked tab value', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} value="a" onChange={onChange} />);
    fireEvent.click(screen.getByText('Heo đất MoMo'));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
