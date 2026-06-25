import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RadioButton } from '@/components/worker/ui/RadioButton';

describe('RadioButton', () => {
  it('renders checked when checked is true', () => {
    render(<RadioButton label="Nam" name="gender" value="male" checked onChange={vi.fn()} />);
    expect(screen.getByLabelText('Nam')).toBeChecked();
  });

  it('calls onChange with its value when clicked', () => {
    const onChange = vi.fn();
    render(<RadioButton label="Nữ" name="gender" value="female" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Nữ'));
    expect(onChange).toHaveBeenCalledWith('female');
  });

  it('is disabled when disabled is true', () => {
    render(<RadioButton label="Theo giờ" name="shift" value="hourly" checked={false} onChange={vi.fn()} disabled />);
    expect(screen.getByLabelText('Theo giờ')).toBeDisabled();
  });
});
