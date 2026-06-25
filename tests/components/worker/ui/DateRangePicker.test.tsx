import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateRangePicker } from '@/components/worker/ui/DateRangePicker';

describe('DateRangePicker', () => {
  it('shows "Select a value" when no range is chosen', () => {
    render(<DateRangePicker value={{ start: null, end: null }} onChange={vi.fn()} />);
    expect(screen.getByText('Select a value')).toBeInTheDocument();
  });

  it('shows both formatted dates when a full range is chosen', () => {
    render(<DateRangePicker value={{ start: new Date(2024, 8, 7), end: new Date(2024, 8, 28) }} onChange={vi.fn()} />);
    expect(screen.getByText('07/09/2024 - 28/09/2024')).toBeInTheDocument();
  });

  it('opens two calendars side by side when the trigger is clicked', () => {
    render(<DateRangePicker value={{ start: new Date(2024, 8, 1), end: null }} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('01/09/2024'));
    expect(screen.getAllByLabelText('Tháng sau').length).toBe(2);
  });

  it('starts a new range when picking a date after a complete range is already set', () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker value={{ start: new Date(2024, 8, 7), end: new Date(2024, 8, 28) }} onChange={onChange} />
    );
    fireEvent.click(screen.getByText('07/09/2024 - 28/09/2024'));
    fireEvent.click(screen.getAllByText('12')[0]);
    expect(onChange).toHaveBeenCalledWith({ start: new Date(2024, 8, 12), end: null });
  });

  it('extends the range backward and closes the popover when picking a date before the current start', () => {
    const onChange = vi.fn();
    render(<DateRangePicker value={{ start: new Date(2024, 8, 15), end: null }} onChange={onChange} />);
    fireEvent.click(screen.getByText('15/09/2024'));
    fireEvent.click(screen.getAllByText('12')[0]);
    expect(onChange).toHaveBeenCalledWith({ start: new Date(2024, 8, 12), end: new Date(2024, 8, 15) });
    expect(screen.queryAllByLabelText('Tháng sau').length).toBe(0);
  });
});
