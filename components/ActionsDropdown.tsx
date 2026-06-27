'use client';

import { useState } from 'react';

type ActionItem = {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
};

export function ActionsDropdown({
  items,
  isLoading = false,
}: {
  items: ActionItem[];
  isLoading?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <button disabled className="border border-border rounded-md px-3 py-1.5 text-sm font-medium opacity-60 cursor-not-allowed">
        Đang xử lý...
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="border border-border rounded-md px-3 py-1.5 text-sm font-medium hover:bg-primary-surface"
      >
        Hành động ▾
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-md shadow-modal border border-border z-20 py-1">
            {items.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-primary-surface ${
                  item.variant === 'danger' ? 'text-status-off-text' : 'text-text-secondary hover:text-primary'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
