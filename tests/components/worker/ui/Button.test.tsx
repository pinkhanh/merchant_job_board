import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/worker/ui/Button';

describe('Button', () => {
  it('renders children as the label', () => {
    render(<Button>Tìm việc</Button>);
    expect(screen.getByRole('button', { name: 'Tìm việc' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Đăng tin</Button>);
    fireEvent.click(screen.getByText('Đăng tin'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled and shows a spinner svg when loading', () => {
    render(<Button loading>Đang lưu</Button>);
    const button = screen.getByRole('button', { name: 'Đang lưu' });
    expect(button).toBeDisabled();
    expect(button.querySelector('svg')).toBeInTheDocument();
  });
});
