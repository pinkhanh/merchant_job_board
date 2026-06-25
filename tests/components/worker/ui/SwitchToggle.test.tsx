import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SwitchToggle } from '@/components/worker/ui/SwitchToggle';

describe('SwitchToggle', () => {
  it('reflects the checked state via aria-checked', () => {
    render(<SwitchToggle checked ariaLabel="Bật thông báo" onChange={vi.fn()} />);
    expect(screen.getByRole('switch', { name: 'Bật thông báo' })).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with the toggled value when clicked', () => {
    const onChange = vi.fn();
    render(<SwitchToggle checked={false} ariaLabel="Bật thông báo" onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('is disabled when disabled is true', () => {
    render(<SwitchToggle checked={false} ariaLabel="Bật thông báo" onChange={vi.fn()} disabled />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });
});
