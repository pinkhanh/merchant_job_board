import { ArrowPathIcon } from '@heroicons/react/24/outline';

type SpinnerProps = {
  variant?: 'spin' | 'dots';
  tone?: 'gray' | 'primary';
};

const DOT_COLORS: Record<NonNullable<SpinnerProps['tone']>, string> = {
  gray: 'bg-worker-text-disabled',
  primary: 'bg-worker-primary',
};

export function Spinner({ variant = 'spin', tone = 'primary' }: SpinnerProps) {
  if (variant === 'dots') {
    return (
      <span role="status" aria-label="Đang tải" className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full animate-bounce ${DOT_COLORS[tone]}`}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
    );
  }

  return (
    <ArrowPathIcon
      role="status"
      aria-label="Đang tải"
      className={`w-5 h-5 animate-spin ${tone === 'primary' ? 'text-worker-primary' : 'text-worker-text-disabled'}`}
    />
  );
}
