import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/tests/test-utils';
import AdminMerchantsNewPage from '@/app/admin/merchants/new/page';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe('AdminMerchantsNewPage', () => {
  it('renders the create merchant form', () => {
    renderWithProviders(<AdminMerchantsNewPage />);
    expect(screen.getByLabelText(/Tên thương hiệu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ngành/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên đăng nhập/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mật khẩu/i)).toBeInTheDocument();
  });

  it('calls POST /api/admin/merchants on submit', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ merchant: { id: 'm1' }, user: { id: 'u1' } }) }) as any;
    renderWithProviders(<AdminMerchantsNewPage />);

    fireEvent.change(screen.getByLabelText(/Tên thương hiệu/i), { target: { value: 'Jollibee' } });
    fireEvent.change(screen.getByLabelText(/Ngành/i), { target: { value: 'F&B' } });
    fireEvent.change(screen.getByLabelText(/Tên đăng nhập/i), { target: { value: 'jollibee_mgr' } });
    fireEvent.change(screen.getByLabelText(/Mật khẩu/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Tạo merchant/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/merchants', expect.objectContaining({ method: 'POST' }));
    });
  });
});
