import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from '@/components/worker/ui/Avatar';

describe('Avatar', () => {
  it('renders an img when variant is image and src is given', () => {
    render(<Avatar variant="image" src="https://cdn.example.com/logo.png" alt="Katinat" />);
    const img = screen.getByRole('img', { name: 'Katinat' });
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/logo.png');
  });

  it('renders no img role for the person variant', () => {
    render(<Avatar variant="person" alt="Katinat" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders the given size as an inline width/height', () => {
    const { container } = render(<Avatar variant="person" size={72} />);
    expect(container.firstChild).toHaveStyle({ width: '72px', height: '72px' });
  });
});
