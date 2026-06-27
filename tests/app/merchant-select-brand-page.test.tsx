import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));

import SelectBrandPage from '@/app/merchant/select-brand/page';

describe('SelectBrandPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    global.fetch = vi.fn();
  });

  it('renders available brands fetched from /api/merchant/brands', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        items: [
          { id: 'm1', brandName: 'Katinat', logoUrl: null },
          { id: 'm2', brandName: 'Highlands Coffee', logoUrl: null },
        ],
      }),
    });

    render(<SelectBrandPage />);

    await waitFor(() => screen.getByText('Katinat'));
    expect(screen.getByText('Highlands Coffee')).toBeInTheDocument();
  });

  it('renders brand logo initial when logoUrl is null', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        items: [{ id: 'm1', brandName: 'Katinat', logoUrl: null }],
      }),
    });

    render(<SelectBrandPage />);

    await waitFor(() => screen.getByText('K'));
  });

  it('calls select-merchant and redirects to dashboard on brand click', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        json: async () => ({
          items: [{ id: 'm1', brandName: 'Katinat', logoUrl: null }],
        }),
      })
      .mockResolvedValueOnce({ json: async () => ({ ok: true }) });

    render(<SelectBrandPage />);

    const button = await waitFor(() => screen.getByRole('button', { name: /katinat/i }));
    fireEvent.click(button);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/merchant/dashboard');
    });
  });
});
