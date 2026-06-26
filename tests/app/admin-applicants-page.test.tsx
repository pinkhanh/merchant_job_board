import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import AdminApplicantsPage from '@/app/admin/applicants/page';

function application(id: string, name: string, brandName: string) {
  return {
    id,
    applicantName: name,
    maskedPhone: '09••••••21',
    importStatus: 'new',
    jobPost: { title: 'Nhân viên pha chế', merchant: { brandName } },
  };
}

describe('AdminApplicantsPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/admin/jobs') {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'jp1', title: 'Nhân viên pha chế' }],
        });
      }
      if (url === '/api/admin/merchants') {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'm1', brandName: 'Cửa hàng ABC' }],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [application('app1', 'Nguyễn Văn A', 'Cửa hàng ABC')],
        blob: async () => new Blob(['csv']),
      });
    }) as any;
  });

  it('fetches applications on initial render and renders the brand and position columns', async () => {
    render(<AdminApplicantsPage />);
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Cửa hàng ABC').length).toBeGreaterThan(0);
    expect(screen.getByText('Thương hiệu')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/applications');
  });
});
