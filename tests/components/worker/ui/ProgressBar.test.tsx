import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '@/components/worker/ui/ProgressBar';

describe('ProgressBar', () => {
  it('sets aria-valuenow to the given value', () => {
    render(<ProgressBar value={40} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');
  });

  it('clamps values above 100', () => {
    render(<ProgressBar value={150} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('clamps negative values to 0', () => {
    render(<ProgressBar value={-10} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
});
