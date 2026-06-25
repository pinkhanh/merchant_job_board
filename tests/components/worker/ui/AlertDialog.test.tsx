import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertDialog } from '@/components/worker/ui/AlertDialog';

describe('AlertDialog', () => {
  it('renders the title and message', () => {
    render(
      <AlertDialog title="Bạn đợi một chút nhé" message="Hệ thống đang bảo trì." confirmLabel="Liên hệ hỗ trợ" onConfirm={vi.fn()} />
    );
    expect(screen.getByText('Bạn đợi một chút nhé')).toBeInTheDocument();
    expect(screen.getByText('Hệ thống đang bảo trì.')).toBeInTheDocument();
  });

  it('has the alertdialog role', () => {
    render(<AlertDialog title="T" message="M" confirmLabel="OK" onConfirm={vi.fn()} />);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('calls onConfirm when the confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<AlertDialog title="T" message="M" confirmLabel="Liên hệ hỗ trợ" onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('Liên hệ hỗ trợ'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('renders the cancel button only when onCancel is given', () => {
    const onCancel = vi.fn();
    render(<AlertDialog title="T" message="M" confirmLabel="OK" cancelLabel="Đóng" onCancel={onCancel} onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByText('Đóng'));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
