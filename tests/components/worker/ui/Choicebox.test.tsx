import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Choicebox } from '@/components/worker/ui/Choicebox';

describe('Choicebox', () => {
  it('renders its children', () => {
    render(<Choicebox selected={false} onClick={vi.fn()}>Business Account</Choicebox>);
    expect(screen.getByText('Business Account')).toBeInTheDocument();
  });

  it('reflects selected via aria-pressed', () => {
    render(<Choicebox selected onClick={vi.fn()}>Business Account</Choicebox>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Choicebox selected={false} onClick={onClick}>8-core CPU</Choicebox>);
    fireEvent.click(screen.getByText('8-core CPU'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled is true', () => {
    render(<Choicebox selected={false} onClick={vi.fn()} disabled>2-core CPU</Choicebox>);
    expect(screen.getByText('2-core CPU').closest('button')).toBeDisabled();
  });
});
