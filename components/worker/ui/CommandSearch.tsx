'use client';

import { MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';

type Option = { value: string; label: string };

type CommandSearchProps = {
  query: string;
  onQueryChange: (query: string) => void;
  options: Option[];
  selected?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
};

export function CommandSearch({ query, onQueryChange, options, selected, onSelect, placeholder = 'Chọn địa điểm' }: CommandSearchProps) {
  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="bg-white rounded-md shadow-worker-card w-[280px] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-worker-border">
        <MagnifyingGlassIcon className="w-4 h-4 text-worker-text-secondary" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-sm outline-none"
        />
      </div>
      <ul className="max-h-[280px] overflow-y-auto py-1">
        {filtered.map((o) => (
          <li key={o.value}>
            <button
              type="button"
              onClick={() => onSelect(o.value)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-worker-bg"
            >
              {o.label}
              {selected === o.value && <CheckIcon className="w-4 h-4 text-worker-primary" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
