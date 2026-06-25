import { InformationCircleIcon } from '@heroicons/react/24/outline';

type CalloutProps = {
  variant: 'neutral' | 'error' | 'success' | 'warning' | 'info';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
};

const VARIANT_CLASSES: Record<CalloutProps['variant'], string> = {
  neutral: 'bg-white border-worker-border text-worker-text-secondary',
  error: 'bg-worker-error-bg border-worker-danger text-worker-danger',
  success: 'bg-worker-success-bg border-worker-success text-worker-success',
  warning: 'bg-worker-warning-bg border-worker-warning-text text-worker-warning-text',
  info: 'bg-worker-info-bg border-worker-info-text text-worker-info-text',
};

export function Callout({ variant, message, actionLabel, onAction, disabled }: CalloutProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : undefined}
      className={`flex items-center gap-2 border rounded-md px-3 py-2.5 text-sm ${
        disabled ? 'bg-worker-bg border-worker-border text-worker-text-disabled' : VARIANT_CLASSES[variant]
      }`}
    >
      <InformationCircleIcon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {actionLabel && (
        <button type="button" onClick={onAction} disabled={disabled} className="font-semibold text-worker-primary shrink-0 disabled:text-worker-text-disabled">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
