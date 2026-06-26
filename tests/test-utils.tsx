import { render, type RenderOptions } from '@testing-library/react';
import { ToastProvider } from '@/components/Toast';
import type { ReactElement } from 'react';

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(<ToastProvider>{ui}</ToastProvider>, options);
}
