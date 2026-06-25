'use client';

import { useState } from 'react';
import { ChevronDownIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

type Option = { value: string; label: string };

type MultiSelectProps = {
  label?: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: Option[];
  placeholder?: string;
};

export function MultiSelect({ label, values, onChange, options, placeholder = 'Select a value' }: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  function toggle(value: string) {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  }

  return (
    <div className="relative flex flex-col gap-1 text-sm w-[260px]">
      {label && <span className="text-xs text-worker-text-secondary">{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-2 border border-worker-border rounded-md px-3 py-2 min-h-[40px] flex-wrap"
      >
        <span className="flex flex-wrap gap-1 flex-1">
          {values.length === 0 && <span className="text-worker-text-disabled">{placeholder}</span>}
          {values.map((v) => {
            const opt = options.find((o) => o.value === v);
            return (
              <span
                key={v}
                className="flex items-center gap-1 bg-worker-accent text-worker-primary rounded-worker-pill px-2 py-0.5 text-xs"
              >
                {opt?.label ?? v}
                <XMarkIcon
                  className="w-3 h-3 cursor-pointer"
                  aria-label={`Xóa ${opt?.label ?? v}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(v);
                  }}
                />
              </span>
            );
          })}
        </span>
        <ChevronDownIcon className="w-4 h-4 shrink-0" />
      </button>
      {open && (
        <ul className="absolute top-full mt-1 left-0 right-0 bg-white border border-worker-border rounded-md shadow-worker-card py-1 z-10 max-h-[240px] overflow-y-auto">
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => toggle(o.value)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-worker-bg"
              >
                {o.label}
                {values.includes(o.value) && <CheckIcon className="w-4 h-4 text-worker-primary" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
