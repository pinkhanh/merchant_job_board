import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '@/components/Pagination';

describe('Pagination', () => {
  it('shows the current count and total', () => {
    render(<Pagination page={1} pageSize={10} total={25} itemLabel="tin" onPageChange={vi.fn()} />);
    expect(screen.getByText('Hiển thị 10 trên 25 tin')).toBeInTheDocument();
  });

  it('shows the correct count on the last partial page', () => {
    render(<Pagination page={3} pageSize={10} total={25} itemLabel="tin" onPageChange={vi.fn()} />);
    expect(screen.getByText('Hiển thị 5 trên 25 tin')).toBeInTheDocument();
  });

  it('renders a button per page and highlights the current page', () => {
    render(<Pagination page={2} pageSize={10} total={25} itemLabel="tin" onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: '1' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
  });

  it('disables the prev button on the first page and enables next', () => {
    render(<Pagination page={1} pageSize={10} total={25} itemLabel="tin" onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('Trang trước')).toBeDisabled();
    expect(screen.getByLabelText('Trang sau')).not.toBeDisabled();
  });

  it('disables the next button on the last page', () => {
    render(<Pagination page={3} pageSize={10} total={25} itemLabel="tin" onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('Trang sau')).toBeDisabled();
  });

  it('calls onPageChange with the clicked page number', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageSize={10} total={25} itemLabel="tin" onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('only shows a window of 5 page numbers when there are many pages', () => {
    render(<Pagination page={6} pageSize={10} total={200} itemLabel="tin" onPageChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '8' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '9' })).not.toBeInTheDocument();
  });
});
