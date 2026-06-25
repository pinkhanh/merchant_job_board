import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Callout } from '@/components/worker/ui/Callout';

describe('Callout', () => {
  it('renders the message', () => {
    render(<Callout variant="neutral" message="Bạn cần cho phép website..." />);
    expect(screen.getByText('Bạn cần cho phép website...')).toBeInTheDocument();
  });

  it('has role="alert" only for the error variant', () => {
    const { rerender } = render(<Callout variant="error" message="Lỗi" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    rerender(<Callout variant="info" message="Thông tin" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls onAction when the action link is clicked', () => {
    const onAction = vi.fn();
    render(<Callout variant="warning" message="Cảnh báo" actionLabel="Upgrade" onAction={onAction} />);
    fireEvent.click(screen.getByText('Upgrade'));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('disables the action when disabled is true', () => {
    render(<Callout variant="neutral" message="Đã tắt" actionLabel="Upgrade" disabled />);
    expect(screen.getByText('Upgrade')).toBeDisabled();
  });
});
