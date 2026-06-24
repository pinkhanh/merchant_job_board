import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));

import { WorkerHeader } from '@/components/WorkerHeader';

describe('WorkerHeader', () => {
  beforeEach(() => pushMock.mockClear());

  it('renders the default location label when no location is selected', () => {
    render(<WorkerHeader />);
    expect(screen.getByText(/Chọn khu vực/)).toBeInTheDocument();
  });

  it('expands the location dropdown on click', () => {
    render(<WorkerHeader />);
    fireEvent.click(screen.getByText(/Chọn khu vực/));
    expect(screen.getByText('Tìm việc tại đây')).toBeInTheDocument();
  });

  it('navigates to /jobs with the selected city and district on confirm', () => {
    render(<WorkerHeader />);
    fireEvent.click(screen.getByText(/Chọn khu vực/));
    fireEvent.change(screen.getByLabelText('Tỉnh/Thành Phố'), { target: { value: 'Hồ Chí Minh' } });
    fireEvent.change(screen.getByLabelText('Quận/Huyện'), { target: { value: 'Quận 1' } });
    fireEvent.click(screen.getByText('Tìm việc tại đây'));

    const expected = `/jobs?${new URLSearchParams({ city: 'Hồ Chí Minh', district: 'Quận 1' }).toString()}`;
    expect(pushMock).toHaveBeenCalledWith(expected);
  });
});
