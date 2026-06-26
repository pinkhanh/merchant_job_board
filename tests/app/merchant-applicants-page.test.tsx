import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import ApplicantsPage from '@/app/merchant/applicants/page';

function application(id: string, name: string) {
  return {
    id,
    applicantName: name,
    phoneNumber: '0987654321',
    importStatus: 'new' as const,
    jobPost: { title: 'Nhân viên pha chế' },
  };
}

describe('ApplicantsPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/jobs') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [{ id: 'jp1', title: 'Nhân viên pha chế' }], total: 1 }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ items: [application('app1', 'Nguyễn Văn A')], total: 18 }),
        blob: async () => new Blob(['csv']),
      });
    }) as any;
  });

  it('fetches page 1 on initial render and renders the items', async () => {
    render(<ApplicantsPage />);
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/applications?page=1');
  });

  it('shows the pagination footer with the total count', async () => {
    render(<ApplicantsPage />);
    await waitFor(() => {
      expect(screen.getByText('Hiển thị 10 trên 18 ứng viên')).toBeInTheDocument();
    });
  });

  it('refetches with the new page when a page button is clicked', async () => {
    render(<ApplicantsPage />);
    await waitFor(() => screen.getByText('Nguyễn Văn A'));

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/applications?page=2');
    });
  });
});
