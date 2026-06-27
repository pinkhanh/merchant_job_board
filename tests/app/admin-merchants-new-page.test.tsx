import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/tests/test-utils';
import AdminMerchantsNewPage from '@/app/admin/merchants/new/page';

const mockPush = vi.fn();
const mockShowToast = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush, back: vi.fn() }) }));
vi.mock('@/components/Toast', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/Toast')>();
  return {
    ...actual,
    useToast: () => mockShowToast,
  };
});

describe('AdminMerchantsNewPage', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockShowToast.mockClear();
  });

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

  it('calls router.push after successful POST', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ merchant: { id: 'm1' }, user: { id: 'u1' } }) }) as any;
    renderWithProviders(<AdminMerchantsNewPage />);

    fireEvent.change(screen.getByLabelText(/Tên thương hiệu/i), { target: { value: 'Jollibee' } });
    fireEvent.change(screen.getByLabelText(/Ngành/i), { target: { value: 'F&B' } });
    fireEvent.change(screen.getByLabelText(/Tên đăng nhập/i), { target: { value: 'jollibee_mgr' } });
    fireEvent.change(screen.getByLabelText(/Mật khẩu/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Tạo merchant/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/merchants');
    });
  });

  it('shows error toast when server returns res.ok = false', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Invalid input' }) }) as any;
    renderWithProviders(<AdminMerchantsNewPage />);

    fireEvent.change(screen.getByLabelText(/Tên thương hiệu/i), { target: { value: 'Jollibee' } });
    fireEvent.change(screen.getByLabelText(/Ngành/i), { target: { value: 'F&B' } });
    fireEvent.change(screen.getByLabelText(/Tên đăng nhập/i), { target: { value: 'jollibee_mgr' } });
    fireEvent.change(screen.getByLabelText(/Mật khẩu/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Tạo merchant/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('error', 'Invalid input');
    });
  });

  it('shows error toast when fetch throws network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as any;
    renderWithProviders(<AdminMerchantsNewPage />);

    fireEvent.change(screen.getByLabelText(/Tên thương hiệu/i), { target: { value: 'Jollibee' } });
    fireEvent.change(screen.getByLabelText(/Ngành/i), { target: { value: 'F&B' } });
    fireEvent.change(screen.getByLabelText(/Tên đăng nhập/i), { target: { value: 'jollibee_mgr' } });
    fireEvent.change(screen.getByLabelText(/Mật khẩu/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Tạo merchant/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('error', 'Tạo merchant thất bại, vui lòng thử lại');
    });
  });
});
