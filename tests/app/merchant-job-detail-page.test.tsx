import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'jp1' }) }));

import MerchantJobDetailPage from '@/app/merchant/jobs/[id]/page';

const job = {
  id: 'jp1',
  title: 'Nhân viên pha chế',
  status: 'live',
  industry: 'F&B',
  employmentType: 'shift',
  salaryMin: 20000,
  salaryMax: 30000,
  salaryType: 'hourly',
  deadline: '2026-12-31',
  description: 'Pha chế đồ uống tại quầy.',
  jobPostStores: [
    { store: { name: 'Katinat Q1', streetAddress: '12 Lê Lợi', ward: 'Bến Nghé', district: 'Quận 1', city: 'Hồ Chí Minh' } },
  ],
};

const applicants = {
  items: [{ id: 'app1', applicantName: 'Nguyễn Văn A', importStatus: 'new' as const }],
  total: 1,
};

function mockFetch(jobResponse = job, applicantsResponse = applicants) {
  global.fetch = vi.fn((url: string) => {
    if (url.startsWith('/api/jobs/')) {
      return Promise.resolve({ ok: true, json: async () => jobResponse });
    }
    if (url.startsWith('/api/applications')) {
      return Promise.resolve({ ok: true, json: async () => applicantsResponse });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  }) as any;
}

describe('MerchantJobDetailPage', () => {
  beforeEach(() => {
    mockFetch();
  });

  it('fetches and renders job details', async () => {
    render(<MerchantJobDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Nhân viên pha chế')).toBeInTheDocument();
      expect(screen.getByText('Pha chế đồ uống tại quầy.')).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/jobs/jp1');
  });

  it('fetches applicants scoped to the job post id and renders them', async () => {
    render(<MerchantJobDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/applications?jobPostId=jp1');
  });

  it('shows a message when there are no applicants', async () => {
    mockFetch(job, { items: [], total: 0 });
    render(<MerchantJobDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Chưa có ứng viên nào ứng tuyển vào vị trí này.')).toBeInTheDocument();
    });
  });

  it('reveals an applicant phone number when the reveal button is clicked', async () => {
    (global.fetch as any).mockImplementation((url: string, init?: any) => {
      if (url.startsWith('/api/jobs/')) return Promise.resolve({ ok: true, json: async () => job });
      if (url.startsWith('/api/applications/') && init?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({ phoneNumber: '0901234567' }) });
      }
      if (url.startsWith('/api/applications')) return Promise.resolve({ ok: true, json: async () => applicants });
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<MerchantJobDetailPage />);
    await waitFor(() => screen.getByText('Hiện SĐT'));
    fireEvent.click(screen.getByText('Hiện SĐT'));

    await waitFor(() => {
      expect(screen.getByText('0901234567')).toBeInTheDocument();
    });
  });

  it('renders the Vietnamese status label for the job', async () => {
    render(<MerchantJobDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Đang tuyển')).toBeInTheDocument();
    });
  });
});
