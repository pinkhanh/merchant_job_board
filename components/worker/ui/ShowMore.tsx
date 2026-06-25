'use client';

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

type ShowMoreProps = {
  onClick: () => void;
  expanded?: boolean;
  label?: string;
  expandedLabel?: string;
};

export function ShowMore({ onClick, expanded, label = 'Xem thêm', expandedLabel = 'Thu gọn' }: ShowMoreProps) {
  const isToggle = expanded !== undefined;
  const text = isToggle && expanded ? expandedLabel : label;
  const Icon = isToggle && expanded ? ChevronUpIcon : ChevronDownIcon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 mx-auto text-sm font-medium text-worker-text-secondary border border-worker-border rounded-worker-pill px-6 py-2.5"
    >
      {text}
      <Icon className="w-4 h-4" />
    </button>
  );
}
