import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { ApplyModal } from '@/components/ApplyModal';

const job = {
  id: 'jp1',
  title: 'Nhân viên pha chế',
  merchant: { brandName: 'Katinat', logoUrl: null },
  jobPostStores: [{ store: { name: 'Katinat Q1', streetAddress: '123 Nguyễn Huệ', district: 'Quận 1', city: 'TP. Hồ Chí Minh' } }],
};

describe('ApplyModal', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('shows the job confirmation block', () => {
    render(<ApplyModal job={job} onClose={vi.fn()} />);
    expect(screen.getByText('Nhân viên pha chế')).toBeInTheDocument();
    expect(screen.getByText(/Katinat/)).toBeInTheDocument();
  });

  it('shows the success state after a successful submit', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 'app1' }) });
    render(<ApplyModal job={job} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Họ và tên *'), { target: { value: 'Nguyễn Văn A' } });
    fireEvent.change(screen.getByLabelText('Số điện thoại *'), { target: { value: '0987654321' } });
    fireEvent.click(screen.getByText('Ứng tuyển ngay'));

    await waitFor(() => {
      expect(screen.getByText('Đã gửi hồ sơ!')).toBeInTheDocument();
    });
  });

  it('shows the duplicate-application error message on a 409', async () => {
    (global.fetch as any).mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: 'Bạn đã ứng tuyển vào vị trí này rồi.' }) });
    render(<ApplyModal job={job} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Họ và tên *'), { target: { value: 'Nguyễn Văn A' } });
    fireEvent.change(screen.getByLabelText('Số điện thoại *'), { target: { value: '0987654321' } });
    fireEvent.click(screen.getByText('Ứng tuyển ngay'));

    await waitFor(() => {
      expect(screen.getByText('Bạn đã ứng tuyển vào vị trí này rồi.')).toBeInTheDocument();
    });
  });

  it('disables the submit button while the form is submitting', async () => {
    let resolveSubmit!: () => void;
    global.fetch = vi.fn().mockReturnValue(
      new Promise<Response>((res) => {
        resolveSubmit = () => res({ ok: true, json: async () => ({}) } as Response);
      })
    );
    render(<ApplyModal job={job} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/Họ và tên/i), { target: { value: 'Nguyen Van A' } });
    fireEvent.change(screen.getByPlaceholderText(/Số điện thoại/i), { target: { value: '0901234567' } });
    fireEvent.click(screen.getByRole('button', { name: /Ứng tuyển/i }));
    expect(screen.getByRole('button', { name: /Đang gửi/i })).toBeDisabled();
    resolveSubmit();
  });
});
