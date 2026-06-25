'use client';

import type { ReactNode } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

type ChoiceboxProps = {
  children: ReactNode;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export function Choicebox({ children, selected, onClick, disabled }: ChoiceboxProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`relative text-left border rounded-md p-3 disabled:opacity-40 ${
        selected ? 'border-worker-primary' : 'border-worker-border'
      }`}
    >
      {selected && <CheckCircleIcon className="w-4 h-4 text-worker-primary absolute top-2 right-2" />}
      {children}
    </button>
  );
}
