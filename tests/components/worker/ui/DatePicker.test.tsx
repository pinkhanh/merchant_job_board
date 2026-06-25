import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatePicker } from '@/components/worker/ui/DatePicker';

describe('DatePicker', () => {
  it('shows "Select a value" when no date is chosen', () => {
    render(<DatePicker value={null} onChange={vi.fn()} />);
    expect(screen.getByText('Select a value')).toBeInTheDocument();
  });

  it('shows the formatted date when one is chosen', () => {
    render(<DatePicker value={new Date(2024, 8, 15)} onChange={vi.fn()} />);
    expect(screen.getByText('15/09/2024')).toBeInTheDocument();
  });

  it('opens the calendar popover when the trigger is clicked', () => {
    render(<DatePicker value={null} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Select a value'));
    expect(screen.getByLabelText('Tháng sau')).toBeInTheDocument();
  });

  it('calls onChange and closes the popover when a day is picked', () => {
    const onChange = vi.fn();
    render(<DatePicker value={new Date(2024, 8, 1)} onChange={onChange} />);
    fireEvent.click(screen.getByText('01/09/2024'));
    fireEvent.click(screen.getByText('15'));
    expect(onChange).toHaveBeenCalledWith(new Date(2024, 8, 15));
    expect(screen.queryByLabelText('Tháng sau')).not.toBeInTheDocument();
  });
});
