import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MerchantProfileView } from '@/components/MerchantProfileView';

const baseProps = {
  brandName: 'Test Brand',
  stores: [],
  storeTotal: 0,
  readOnly: false,
  onSave: () => {},
  onDescriptionChange: () => {},
  onHotlineChange: () => {},
  categoryInput: '',
  onCategoryInputChange: () => {},
  onAddCategory: () => {},
  onRemoveCategory: () => {},
};

describe('MerchantProfileView', () => {
  it('does not render "Đồng bộ từ Business Page" badge', () => {
    render(<MerchantProfileView {...baseProps} />);
    expect(screen.queryByText('Đồng bộ từ Business Page')).not.toBeInTheDocument();
  });

  it('does not render the "Thông tin đồng bộ" sidebar card', () => {
    render(<MerchantProfileView {...baseProps} />);
    expect(screen.queryByText('Thông tin đồng bộ')).not.toBeInTheDocument();
  });

  it('does not render Đồng bộ từ Business Page badge', () => {
    render(<MerchantProfileView {...baseProps} />);
    expect(screen.queryByText(/Đồng bộ từ Business Page/i)).not.toBeInTheDocument();
  });

  it('does not render Thiết lập ngành nghề text', () => {
    render(<MerchantProfileView {...baseProps} />);
    expect(screen.queryByText(/Thiết lập ngành nghề/i)).not.toBeInTheDocument();
  });

  it('renders store filter bar below Danh sách cửa hàng heading', () => {
    const propsWithStores = {
      ...baseProps,
      stores: [{ id: 's1', name: 'Katinat Q1', streetAddress: '1 Lê Lợi', ward: null, district: null, city: null, openingHours: '08:00 - 22:00' }],
      storeTotal: 1,
    };
    render(<MerchantProfileView {...propsWithStores} />);
    expect(screen.getByPlaceholderText(/Tìm cửa hàng/i)).toBeInTheDocument();
  });
});
