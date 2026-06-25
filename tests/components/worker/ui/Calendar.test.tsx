import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Calendar } from '@/components/worker/ui/Calendar';

describe('Calendar', () => {
  it('renders the month/year header', () => {
    render(<Calendar month={new Date(2024, 8, 1)} onMonthChange={vi.fn()} onSelectDate={vi.fn()} />);
    expect(screen.getByText('Tháng 9/2024')).toBeInTheDocument();
  });

  it('renders a button for each day of the month', () => {
    render(<Calendar month={new Date(2024, 8, 1)} onMonthChange={vi.fn()} onSelectDate={vi.fn()} />);
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.queryByText('31')).not.toBeInTheDocument();
  });

  it('calls onSelectDate when a day is clicked', () => {
    const onSelectDate = vi.fn();
    render(<Calendar month={new Date(2024, 8, 1)} onMonthChange={vi.fn()} onSelectDate={onSelectDate} />);
    fireEvent.click(screen.getByText('15'));
    expect(onSelectDate).toHaveBeenCalledWith(new Date(2024, 8, 15));
  });

  it('calls onMonthChange with the next month when the next button is clicked', () => {
    const onMonthChange = vi.fn();
    render(<Calendar month={new Date(2024, 8, 1)} onMonthChange={onMonthChange} onSelectDate={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Tháng sau'));
    expect(onMonthChange).toHaveBeenCalledWith(new Date(2024, 9, 1));
  });
});
