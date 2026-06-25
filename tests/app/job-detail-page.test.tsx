import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'jp1' }) }));

import JobDetailPage from '@/app/jobs/[id]/page';

const liveJob = {
  id: 'jp1',
  title: 'Nhân viên pha chế',
  industry: 'F&B',
  employmentType: 'shift',
  salaryMin: 20000,
  salaryMax: 30000,
  schedule: { days: ['mon'], start: '08:00', end: '17:00' },
  requirements: 'Nhanh nhẹn',
  benefits: ['Đồng phục'],
  description: 'Pha chế đồ uống tại quầy.',
  isClosed: false,
  merchant: { brandName: 'Katinat', logoUrl: null },
  jobPostStores: [{ store: { name: 'Katinat Q1', streetAddress: '12 Lê Lợi', ward: 'Bến Nghé', district: 'Quận 1', city: 'Hồ Chí Minh' } }],
};

describe('JobDetailPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => liveJob });
  });

  it('renders job details fetched from the API', async () => {
    render(<JobDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Nhân viên pha chế')).toBeInTheDocument();
      expect(screen.getByText('Pha chế đồ uống tại quầy.')).toBeInTheDocument();
    });
  });

  it('opens the apply modal when "Ứng tuyển ngay" is clicked', async () => {
    render(<JobDetailPage />);
    await waitFor(() => screen.getByText('Ứng tuyển ngay'));
    fireEvent.click(screen.getByText('Ứng tuyển ngay'));
    expect(screen.getByText('Bạn đang ứng tuyển vào:')).toBeInTheDocument();
  });

  it('disables the apply CTA and shows the closed badge when isClosed is true', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({ ...liveJob, isClosed: true }) });
    render(<JobDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Đã hết hạn nộp')).toBeInTheDocument();
      expect(screen.getByText('Ứng tuyển ngay')).toBeDisabled();
    });
  });

  it('renders the merchant logo image when logoUrl is present', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        ...liveJob,
        merchant: { brandName: 'Katinat', logoUrl: 'https://cdn.example.com/katinat-logo.png' },
      }),
    });
    render(<JobDetailPage />);
    await waitFor(() => {
      const img = screen.getByRole('img', { name: 'Katinat' });
      expect(img).toHaveAttribute('src', 'https://cdn.example.com/katinat-logo.png');
    });
  });

  it('falls back to the placeholder circle when logoUrl is null', async () => {
    render(<JobDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Nhân viên pha chế')).toBeInTheDocument();
    });
    expect(screen.queryByRole('img', { name: 'Katinat' })).not.toBeInTheDocument();
  });
});
