import { UserIcon } from '@heroicons/react/24/solid';

type AvatarProps = {
  variant?: 'text' | 'person' | 'image';
  src?: string;
  alt?: string;
  text?: string;
  shape?: 'circle' | 'square';
  size?: 24 | 32 | 40 | 48 | 56 | 72;
};

export function Avatar({ variant = 'image', src, alt = '', text, shape = 'circle', size = 48 }: AvatarProps) {
  const dimension = `${size}px`;
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-md';

  if (variant === 'image' && src) {
    return (
      <img
        src={src}
        alt={alt}
        style={{ width: dimension, height: dimension }}
        className={`object-cover shrink-0 ${radius}`}
      />
    );
  }

  return (
    <span
      style={{ width: dimension, height: dimension }}
      className={`flex items-center justify-center bg-worker-accent text-worker-primary font-semibold shrink-0 ${radius}`}
    >
      {variant === 'person' ? <UserIcon className="w-1/2 h-1/2" /> : (text ?? alt.charAt(0).toUpperCase() ?? 'A')}
    </span>
  );
}
