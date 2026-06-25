import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import AdminApplicantsPage from '@/app/admin/applicants/page';

function application(id: string, name: string, brandName: string) {
  return {
    id,
    applicantName: name,
    importStatus: 'new',
    jobPost: { title: 'Nhân viên pha chế', merchant: { brandName } },
  };
}

describe('AdminApplicantsPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [application('app1', 'Nguyễn Văn A', 'Cửa hàng ABC')],
      blob: async () => new Blob(['csv']),
    }) as any;
  });

  it('fetches applications on initial render and renders the merchant column', async () => {
    render(<AdminApplicantsPage />);
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });
    expect(screen.getByText('Cửa hàng ABC')).toBeInTheDocument();
    expect(screen.getByText('Merchant')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/applications');
  });
});
