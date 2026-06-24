import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StoreFilterBar } from '@/components/StoreFilterBar';

describe('StoreFilterBar', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('debounces keyword changes before calling onKeywordChange', () => {
    const onKeywordChange = vi.fn();
    render(
      <StoreFilterBar
        keyword=""
        onKeywordChange={onKeywordChange}
        city=""
        onCityChange={vi.fn()}
        district=""
        onDistrictChange={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('Tìm kiếm'), { target: { value: 'Quận 1' } });
    expect(onKeywordChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(onKeywordChange).toHaveBeenCalledWith('Quận 1');
  });

  it('disables the district select until a city is chosen', () => {
    render(
      <StoreFilterBar
        keyword=""
        onKeywordChange={vi.fn()}
        city=""
        onCityChange={vi.fn()}
        district=""
        onDistrictChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Quận/Huyện')).toBeDisabled();
  });

  it('calls onCityChange when a province/city is selected', () => {
    const onCityChange = vi.fn();
    render(
      <StoreFilterBar
        keyword=""
        onKeywordChange={vi.fn()}
        city=""
        onCityChange={onCityChange}
        district=""
        onDistrictChange={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('Tỉnh/Thành Phố'), { target: { value: 'Hà Nội' } });
    expect(onCityChange).toHaveBeenCalledWith('Hà Nội');
  });

  it('calls onDistrictChange when a district is selected', () => {
    const onDistrictChange = vi.fn();
    render(
      <StoreFilterBar
        keyword=""
        onKeywordChange={vi.fn()}
        city="Hà Nội"
        onCityChange={vi.fn()}
        district=""
        onDistrictChange={onDistrictChange}
      />
    );

    fireEvent.change(screen.getByLabelText('Quận/Huyện'), { target: { value: 'Cầu Giấy' } });
    expect(onDistrictChange).toHaveBeenCalledWith('Cầu Giấy');
  });
});
