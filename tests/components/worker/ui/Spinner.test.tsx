import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Spinner } from '@/components/worker/ui/Spinner';

describe('Spinner', () => {
  it('renders an svg for the default spin variant', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders 3 dots for the dots variant', () => {
    const { container } = render(<Spinner variant="dots" />);
    expect(container.querySelectorAll('span > span').length).toBe(3);
  });
});
