import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Notification } from '@/components/worker/ui/Notification';

describe('Notification', () => {
  it('renders the title and message', () => {
    render(<Notification variant="success" title="Thành công" message="Nội dung tối đa 2 dòng" />);
    expect(screen.getByText('Thành công')).toBeInTheDocument();
    expect(screen.getByText('Nội dung tối đa 2 dòng')).toBeInTheDocument();
  });

  it('calls onDismiss when the close button is clicked', () => {
    const onDismiss = vi.fn();
    render(<Notification variant="error" message="Lỗi" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByLabelText('Đóng'));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('does not render a close button when onDismiss is not given', () => {
    render(<Notification variant="warning" message="Cảnh báo" />);
    expect(screen.queryByLabelText('Đóng')).not.toBeInTheDocument();
  });

  it('calls onLinkClick when the text link is clicked', () => {
    const onLinkClick = vi.fn();
    render(<Notification variant="success" message="OK" linkLabel="Tắt thông báo" onLinkClick={onLinkClick} />);
    fireEvent.click(screen.getByText('Tắt thông báo'));
    expect(onLinkClick).toHaveBeenCalledOnce();
  });
});
