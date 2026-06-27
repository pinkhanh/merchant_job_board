// tests/app/jobs-new-page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/tests/test-utils';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));

import JobWizardPage from '@/app/merchant/jobs/new/page';

describe('JobWizardPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    global.fetch = vi.fn((url: string) => {
      if (url.startsWith('/api/merchant/stores')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [{ id: 's1', name: 'Trụ Sở Chính' }], total: 1 }),
        });
      }
      if (url === '/api/merchant/jobs') {
        return Promise.resolve({ ok: true, json: async () => ({ id: 'jp1' }) });
      }
      // AI description endpoint
      if (url.includes('/api/ai/generate-description')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ roleOverview: 'Mô tả', requirements: 'Yêu cầu', benefits: 'Quyền lợi' }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }) as any;
  });

  it('loads stores into Step 1', async () => {
    renderWithProviders(<JobWizardPage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Trụ Sở Chính')).toBeInTheDocument();
    });
  });

  it('does not allow submitting Step 1 with no store selected', async () => {
    renderWithProviders(<JobWizardPage />);
    await waitFor(() => screen.getByLabelText('Trụ Sở Chính'));
    fireEvent.click(screen.getByText('Tiếp theo'));
    expect(screen.getByText('Vui lòng chọn ít nhất 1 cửa hàng')).toBeInTheDocument();
  });

  it('shows the store search/filter bar', async () => {
    renderWithProviders(<JobWizardPage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Tìm kiếm')).toBeInTheDocument();
      expect(screen.getByLabelText('Tỉnh/Thành Phố')).toBeInTheDocument();
    });
  });

  it('shows a "Xem thêm" button when there are more stores than the first page', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.startsWith('/api/merchant/stores')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [{ id: 's1', name: 'Trụ Sở Chính' }], total: 11 }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderWithProviders(<JobWizardPage />);
    await waitFor(() => {
      expect(screen.getByText('Xem thêm')).toBeInTheDocument();
    });
  });

  async function goToStep2() {
    renderWithProviders(<JobWizardPage />);
    await waitFor(() => screen.getByLabelText('Trụ Sở Chính'));
    fireEvent.click(screen.getByLabelText('Trụ Sở Chính'));
    fireEvent.click(screen.getByText('Tiếp theo'));
    await waitFor(() => screen.getByText('Tạo mô tả với AI'));
  }

  async function goToStep3() {
    await goToStep2();
    fireEvent.click(screen.getByText('Tạo mô tả với AI'));
    await waitFor(() => screen.getByText('Mô tả công việc (AI đề xuất)'));
  }

  it('does not show a Back button on Step 1', async () => {
    renderWithProviders(<JobWizardPage />);
    await waitFor(() => screen.getByLabelText('Trụ Sở Chính'));
    expect(screen.queryByText('Quay lại')).not.toBeInTheDocument();
  });

  it('shows a Back button on Step 2 that returns to Step 1 and preserves selection', async () => {
    await goToStep2();
    expect(screen.getByText('Quay lại')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Quay lại'));
    await waitFor(() => screen.getByLabelText('Trụ Sở Chính'));
    expect((screen.getByLabelText('Trụ Sở Chính') as HTMLInputElement).checked).toBe(true);
  });

  it('navigates Step 2 -> Step 3 -> back to Step 2 preserving entered title', async () => {
    await goToStep2();
    fireEvent.change(screen.getByLabelText('Tên vị trí tuyển dụng'), { target: { value: 'Nhân viên bán hàng' } });
    fireEvent.click(screen.getByText('Tạo mô tả với AI'));
    await waitFor(() => screen.getByText('Quay lại'));

    fireEvent.click(screen.getByText('Quay lại'));
    await waitFor(() => screen.getByLabelText('Tên vị trí tuyển dụng'));
    expect((screen.getByLabelText('Tên vị trí tuyển dụng') as HTMLInputElement).value).toBe('Nhân viên bán hàng');
  });

  it('shows a Back button on Step 4 that returns to Step 3', async () => {
    await goToStep3();
    fireEvent.click(screen.getByText('Tiếp theo'));
    await waitFor(() => screen.getByRole('button', { name: 'Đăng tin' }));

    fireEvent.click(screen.getByText('Quay lại'));
    await waitFor(() => screen.getByText('Mô tả công việc (AI đề xuất)'));
  });

  it('shows salaryMin, salaryMax inputs and salaryType selector on Step 2', async () => {
    await goToStep2();
    expect(screen.getByLabelText('Lương tối thiểu')).toBeInTheDocument();
    expect(screen.getByLabelText('Lương tối đa')).toBeInTheDocument();
    expect(screen.getByText('Theo giờ')).toBeInTheDocument();
    expect(screen.getAllByText('Theo ca').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Theo tháng')).toBeInTheDocument();
    expect(screen.getByText('Thỏa thuận')).toBeInTheDocument();
  });

  it('shows the manual mode UI by default with both selection-mode radios', async () => {
    renderWithProviders(<JobWizardPage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Lựa chọn địa điểm làm việc')).toBeInTheDocument();
      expect(screen.getByLabelText('Lựa chọn khu vực')).toBeInTheDocument();
    });
    expect((screen.getByLabelText('Lựa chọn địa điểm làm việc') as HTMLInputElement).checked).toBe(true);
    expect(screen.getByLabelText('Trụ Sở Chính')).toBeInTheDocument();
  });

  it('switching to "Lựa chọn khu vực" hides the manual checkbox list and shows Tỉnh/Quận selects', async () => {
    renderWithProviders(<JobWizardPage />);
    await waitFor(() => screen.getByLabelText('Trụ Sở Chính'));

    fireEvent.click(screen.getByLabelText('Lựa chọn khu vực'));

    expect(screen.queryByLabelText('Trụ Sở Chính')).not.toBeInTheDocument();
    expect(screen.getByText('Tỉnh/Thành Phố')).toBeInTheDocument();
    expect(screen.getByText('Quận/Huyện')).toBeInTheDocument();
  });

  it('selecting a Tỉnh + Quận in region mode bulk-selects all matching stores into storeIds', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.startsWith('/api/merchant/stores')) {
        const parsed = new URL(url, 'http://localhost');
        if (parsed.searchParams.get('city') === 'Hà Nội' && parsed.searchParams.get('district') === 'Cầu Giấy') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              items: [
                { id: 'r1', name: 'Cửa hàng Cầu Giấy 1' },
                { id: 'r2', name: 'Cửa hàng Cầu Giấy 2' },
              ],
              total: 2,
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [{ id: 's1', name: 'Trụ Sở Chính' }], total: 1 }),
        });
      }
      if (url === '/api/merchant/jobs') {
        return Promise.resolve({ ok: true, json: async () => ({ id: 'jp1' }) });
      }
      if (url.includes('/api/ai/generate-description')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ roleOverview: 'Mô tả', requirements: 'Yêu cầu', benefits: 'Quyền lợi' }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderWithProviders(<JobWizardPage />);
    await waitFor(() => screen.getByLabelText('Trụ Sở Chính'));

    fireEvent.click(screen.getByLabelText('Lựa chọn khu vực'));
    fireEvent.change(screen.getByLabelText('Tỉnh/Thành Phố'), { target: { value: 'Hà Nội' } });
    fireEvent.change(screen.getByLabelText('Quận/Huyện'), { target: { value: 'Cầu Giấy' } });

    await waitFor(() => {
      expect(screen.getByText('Đã chọn 2 cửa hàng tại Cầu Giấy, Hà Nội')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Tiếp theo'));
    await waitFor(() => screen.getByLabelText('Tên vị trí tuyển dụng'));

    fireEvent.change(screen.getByLabelText('Tên vị trí tuyển dụng'), { target: { value: 'Nhân viên khu vực' } });
    fireEvent.click(screen.getByText('Tạo mô tả với AI'));
    await waitFor(() => screen.getByText('Mô tả công việc (AI đề xuất)'));
    fireEvent.click(screen.getByText('Tiếp theo'));
    await waitFor(() => screen.getByRole('button', { name: 'Đăng tin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Đăng tin' }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/merchant/jobs');
    });

    const jobsCall = (global.fetch as any).mock.calls.find((c: any[]) => c[0] === '/api/merchant/jobs');
    expect(jobsCall).toBeTruthy();
    const body = JSON.parse(jobsCall[1].body);
    expect(body.storeIds).toEqual(['r1', 'r2']);
  });

  it('switching back to manual mode clears the region-derived storeIds selection', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.startsWith('/api/merchant/stores')) {
        const parsed = new URL(url, 'http://localhost');
        if (parsed.searchParams.get('city') === 'Hà Nội' && parsed.searchParams.get('district') === 'Cầu Giấy') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ items: [{ id: 'r1', name: 'Cửa hàng Cầu Giấy 1' }], total: 1 }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [{ id: 's1', name: 'Trụ Sở Chính' }], total: 1 }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderWithProviders(<JobWizardPage />);
    await waitFor(() => screen.getByLabelText('Trụ Sở Chính'));

    fireEvent.click(screen.getByLabelText('Lựa chọn khu vực'));
    fireEvent.change(screen.getByLabelText('Tỉnh/Thành Phố'), { target: { value: 'Hà Nội' } });
    fireEvent.change(screen.getByLabelText('Quận/Huyện'), { target: { value: 'Cầu Giấy' } });
    await waitFor(() => {
      expect(screen.getByText('Đã chọn 1 cửa hàng tại Cầu Giấy, Hà Nội')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Lựa chọn địa điểm làm việc'));

    await waitFor(() => screen.getByLabelText('Trụ Sở Chính'));
    expect(screen.getByLabelText('Trụ Sở Chính')).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByText('Tiếp theo'));
    expect(screen.getByText('Vui lòng chọn ít nhất 1 cửa hàng')).toBeInTheDocument();
  });

  it('sends salaryMin, salaryMax and salaryType in the publish payload', async () => {
    await goToStep2();
    fireEvent.change(screen.getByLabelText('Tên vị trí tuyển dụng'), { target: { value: 'Nhân viên bán hàng' } });
    fireEvent.change(screen.getByLabelText('Lương tối thiểu'), { target: { value: '5000000' } });
    fireEvent.change(screen.getByLabelText('Lương tối đa'), { target: { value: '8000000' } });
    fireEvent.click(screen.getByText('Theo tháng'));

    fireEvent.click(screen.getByText('Tạo mô tả với AI'));
    await waitFor(() => screen.getByText('Mô tả công việc (AI đề xuất)'));
    fireEvent.click(screen.getByText('Tiếp theo'));
    await waitFor(() => screen.getByRole('button', { name: 'Đăng tin' }));

    fireEvent.click(screen.getByRole('button', { name: 'Đăng tin' }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/merchant/jobs');
    });

    const jobsCall = (global.fetch as any).mock.calls.find((c: any[]) => c[0] === '/api/merchant/jobs');
    expect(jobsCall).toBeTruthy();
    const body = JSON.parse(jobsCall[1].body);
    expect(body.salaryMin).toBe(5000000);
    expect(body.salaryMax).toBe(8000000);
    expect(body.salaryType).toBe('monthly');
  });

  it('shows store count summary in step 1', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ id: 's1', name: 'Katinat Q1', district: 'Quận 1', city: 'HCM', streetAddress: '1 Lê Lợi', ward: 'Phường 1' }], total: 3 }),
    }) as any;
    renderWithProviders(<JobWizardPage />);
    await waitFor(() => {
      expect(screen.getByText(/3 cửa hàng/)).toBeInTheDocument();
    });
  });

  it('shows full address on second line of store card', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url.startsWith('/api/merchant/stores')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            items: [{
              id: 's1',
              name: 'Katinat Q1',
              streetAddress: '1 Lê Lợi',
              ward: 'Phường Bến Nghé',
              district: 'Quận 1',
              city: 'TP. Hồ Chí Minh',
            }],
            total: 1,
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }) as any;
    renderWithProviders(<JobWizardPage />);
    await waitFor(() => screen.getByText('Katinat Q1'));
    expect(screen.getByText('1 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh')).toBeInTheDocument();
  });

  it('shows specific API error message when posting fails', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.startsWith('/api/merchant/stores')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [{ id: 's1', name: 'Trụ Sở Chính' }], total: 1 }),
        });
      }
      if (url === '/api/merchant/jobs') {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: 'employmentType không hợp lệ' }),
        });
      }
      if (url.includes('/api/ai/generate-description')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ roleOverview: 'Mô tả', requirements: 'Yêu cầu', benefits: 'Quyền lợi' }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderWithProviders(<JobWizardPage />);
    await waitFor(() => screen.getByLabelText('Trụ Sở Chính'));
    fireEvent.click(screen.getByLabelText('Trụ Sở Chính'));
    fireEvent.click(screen.getByText('Tiếp theo'));
    await waitFor(() => screen.getByText('Tạo mô tả với AI'));

    // Fill in title before generating description
    const titleInputs = screen.getAllByRole('textbox');
    fireEvent.change(titleInputs[0], { target: { value: 'Nhân viên bán hàng' } });

    fireEvent.click(screen.getByText('Tạo mô tả với AI'));
    await waitFor(() => screen.getByText(/Mô tả công việc/));

    fireEvent.click(screen.getByText('Tiếp theo'));
    await waitFor(() => screen.getByRole('button', { name: 'Đăng tin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Đăng tin' }));

    await waitFor(() => {
      expect(screen.getByText('employmentType không hợp lệ')).toBeInTheDocument();
    });
  });
});
