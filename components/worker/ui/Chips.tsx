'use client';

import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

type ChipsProps = {
  label: string;
  variant?: 'primary' | 'outline' | 'secondary';
  size?: 'sm' | 'md';
  selected?: boolean;
  showAdd?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
};

const VARIANT_CLASSES: Record<NonNullable<ChipsProps['variant']>, string> = {
  primary: 'bg-worker-primary text-white border-worker-primary',
  outline: 'bg-white text-worker-primary border-worker-primary',
  secondary: 'bg-white text-worker-text-secondary border-worker-border',
};

export function Chips({ label, variant = 'secondary', size = 'md', selected = false, showAdd = false, onRemove, onClick }: ChipsProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 rounded-worker-pill border font-medium ${VARIANT_CLASSES[variant]} ${
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
      } ${selected ? 'ring-2 ring-worker-primary/30' : ''}`}
    >
      {showAdd && <PlusIcon className="w-3.5 h-3.5" />}
      {label}
      {onRemove && (
        <XMarkIcon
          className="w-3.5 h-3.5"
          aria-label={`Xóa ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </button>
  );
}
