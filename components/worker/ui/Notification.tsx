'use client';

import { CheckCircleIcon, ExclamationTriangleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';

type NotificationProps = {
  variant: 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  linkLabel?: string;
  onLinkClick?: () => void;
  onDismiss?: () => void;
};

const ICONS = {
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: ExclamationCircleIcon,
};

const ICON_COLORS: Record<NotificationProps['variant'], string> = {
  success: 'text-worker-success',
  warning: 'text-worker-warning-text',
  error: 'text-worker-danger',
};

export function Notification({ variant, title, message, linkLabel, onLinkClick, onDismiss }: NotificationProps) {
  const Icon = ICONS[variant];

  return (
    <div className="flex items-start gap-2 bg-white rounded-md shadow-worker-modal px-4 py-3 w-[360px]">
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${ICON_COLORS[variant]}`} />
      <div className="flex-1">
        {title && <p className="font-bold text-sm mb-0.5">{title}</p>}
        <p className="text-sm">{message}</p>
        {linkLabel && (
          <button type="button" onClick={onLinkClick} className="text-worker-info-text text-sm mt-1">
            {linkLabel}
          </button>
        )}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Đóng">
          <XMarkIcon className="w-4 h-4 text-worker-text-secondary" />
        </button>
      )}
    </div>
  );
}
