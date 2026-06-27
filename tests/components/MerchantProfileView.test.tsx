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
});
