import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from '@/components/worker/ui/Checkbox';

describe('Checkbox', () => {
  it('renders the label and reflects the checked state', () => {
    render(<Checkbox label="Bay thẳng" checked onChange={vi.fn()} />);
    expect(screen.getByLabelText('Bay thẳng')).toBeChecked();
  });

  it('calls onChange with the new checked value', () => {
    const onChange = vi.fn();
    render(<Checkbox label="Bay thẳng" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Bay thẳng'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('is disabled when disabled is true', () => {
    render(<Checkbox label="Disable" checked={false} onChange={vi.fn()} disabled />);
    expect(screen.getByLabelText('Disable')).toBeDisabled();
  });
});
