import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const pushMock = vi.fn();
const replaceMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(),
}));

import JobsPage from '@/app/jobs/page';

const sampleResponse = {
  jobs: [
    {
      id: 'jp1',
      title: 'Nhân viên pha chế',
      employmentType: 'shift',
      salaryMin: 20000,
      salaryMax: 30000,
      salaryType: 'hourly',
      createdAt: new Date().toISOString(),
      merchant: { brandName: 'Katinat', logoUrl: null },
      jobPostStores: [{ store: { name: 'Katinat Q1', district: 'Quận 1', city: 'Hồ Chí Minh' } }],
    },
  ],
  total: 1,
  counts: {
    employmentType: { part_time: 2, shift: 1, seasonal: 0 },
    industry: { 'F&B': 1 },
    merchant: [{ id: 'm1', brandName: 'Katinat', logoUrl: null, count: 1 }],
    minSalary: [{ threshold: 3000000, count: 1 }],
  },
};

describe('JobsPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => sampleResponse });
    global.localStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() } as any;
  });

  it('renders job cards returned by the API', async () => {
    render(<JobsPage />);
    await waitFor(() => {
      expect(screen.getByText('Nhân viên pha chế')).toBeInTheDocument();
      expect(screen.getAllByText('Katinat').length).toBeGreaterThan(0);
    });
  });

  it('shows the live count next to each employment type chip', async () => {
    render(<JobsPage />);
    await waitFor(() => {
      expect(screen.getByText('Theo ca (1)')).toBeInTheDocument();
      expect(screen.getByText('Bán thời gian (2)')).toBeInTheDocument();
    });
  });

  it('shows the empty state when there are no jobs', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ ...sampleResponse, jobs: [], total: 0 }),
    });
    render(<JobsPage />);
    await waitFor(() => {
      expect(screen.getByText(/Không tìm thấy việc làm phù hợp/)).toBeInTheDocument();
    });
  });

  it('renders the merchant logo image on the job card and filter pill when logoUrl is present', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        ...sampleResponse,
        jobs: [
          {
            ...sampleResponse.jobs[0],
            merchant: { brandName: 'Katinat', logoUrl: 'https://cdn.example.com/katinat-logo.png' },
          },
        ],
        counts: {
          ...sampleResponse.counts,
          merchant: [{ id: 'm1', brandName: 'Katinat', logoUrl: 'https://cdn.example.com/katinat-logo.png', count: 1 }],
        },
      }),
    });
    render(<JobsPage />);
    await waitFor(() => {
      const images = screen.getAllByRole('img', { name: 'Katinat' });
      expect(images.length).toBe(2);
      images.forEach((img) => expect(img).toHaveAttribute('src', 'https://cdn.example.com/katinat-logo.png'));
    });
  });

  it('falls back to the placeholder circle when logoUrl is null', async () => {
    render(<JobsPage />);
    await waitFor(() => {
      expect(screen.getByText('Nhân viên pha chế')).toBeInTheDocument();
    });
    expect(screen.queryByRole('img', { name: 'Katinat' })).not.toBeInTheDocument();
  });

  it('renders the updated description text', async () => {
    render(<JobsPage />);
    await waitFor(() => {
      expect(
        screen.getByText('Hàng loạt việc làm tại các thương hiệu cùng MoMo')
      ).toBeInTheDocument();
    });
  });

  it('shows job result count', async () => {
    render(<JobsPage />);
    await waitFor(() => {
      expect(screen.getByText(/1 việc làm/)).toBeInTheDocument();
    });
  });

  it('shows "2 địa điểm" for multi-store jobs instead of a single store name', async () => {
    const multiStoreResponse = {
      ...sampleResponse,
      jobs: [
        {
          ...sampleResponse.jobs[0],
          jobPostStores: [
            { store: { name: 'Katinat Q1', district: 'Quận 1', city: 'HCM' } },
            { store: { name: 'Katinat Q3', district: 'Quận 3', city: 'HCM' } },
          ],
        },
      ],
    };
    (global.fetch as any).mockResolvedValue({ ok: true, json: async () => multiStoreResponse });
    render(<JobsPage />);
    await waitFor(() => {
      expect(screen.getByText('2 địa điểm')).toBeInTheDocument();
    });
  });
});
