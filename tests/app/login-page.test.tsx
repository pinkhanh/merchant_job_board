import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));

import LoginPage from '@/app/login/page';

describe('LoginPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    global.fetch = vi.fn();
  });

  it('shows an error message when login fails', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Sai tài khoản hoặc mật khẩu' }),
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Tên đăng nhập'), { target: { value: 'wrong' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Sai tài khoản hoặc mật khẩu');
    });
  });

  it('redirects to /merchant/dashboard on successful merchant login', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, role: 'merchant' }),
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Tên đăng nhập'), { target: { value: 'merchant1' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'correct' } });
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/merchant/dashboard');
    });
  });

  it('redirects to /admin/merchants on successful admin login', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, role: 'admin' }),
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Tên đăng nhập'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'ChangeMe123!' } });
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/admin/merchants');
    });
  });

  it('redirects to /merchant/select-brand for multi-brand users', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, requiresBrandSelection: true }),
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Tên đăng nhập'), { target: { value: 'multi' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/merchant/select-brand');
    });
  });

  it('applies the secondary text color to the form so default text inherits it', () => {
    render(<LoginPage />);
    expect(screen.getByText('Đăng nhập', { selector: 'h1' }).closest('form')).toHaveClass('text-text-secondary');
  });
});
