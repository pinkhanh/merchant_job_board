'use client';

import type { ReactNode } from 'react';

type IconButtonProps = {
  icon: ReactNode;
  ariaLabel: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'tonal' | 'danger';
  onClick?: () => void;
  disabled?: boolean;
};

const VARIANT_CLASSES: Record<NonNullable<IconButtonProps['variant']>, string> = {
  primary: 'bg-worker-primary text-white',
  secondary: 'bg-white text-worker-text-secondary border border-worker-border',
  outline: 'bg-white text-worker-primary border border-worker-primary',
  tonal: 'bg-worker-accent text-worker-primary',
  danger: 'bg-worker-danger text-white',
};

export function IconButton({ icon, ariaLabel, variant = 'primary', onClick, disabled }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center w-9 h-9 rounded-full disabled:opacity-50 [&_svg]:w-4 [&_svg]:h-4 ${VARIANT_CLASSES[variant]}`}
    >
      {icon}
    </button>
  );
}
