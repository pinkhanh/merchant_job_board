'use client';

import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function SearchBar({ value, onChange, placeholder = 'Bạn cần tìm gì ....', disabled }: SearchBarProps) {
  return (
    <div
      className={`flex items-center gap-2 border rounded-md px-3 py-2.5 ${
        disabled ? 'bg-worker-bg border-worker-border' : 'border-worker-border'
      }`}
    >
      <MagnifyingGlassIcon className="w-4 h-4 text-worker-text-secondary shrink-0" />
      <input
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-sm outline-none disabled:bg-transparent disabled:text-worker-text-disabled"
      />
      {value && (
        <button type="button" aria-label="Xóa" onClick={() => onChange('')}>
          <XMarkIcon className="w-4 h-4 text-worker-text-secondary" />
        </button>
      )}
    </div>
  );
}
