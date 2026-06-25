'use client';

type CheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'medium' | 'large';
  disabled?: boolean;
};

export function Checkbox({ label, checked, onChange, size = 'medium', disabled }: CheckboxProps) {
  return (
    <label
      className={`flex items-center gap-2 ${size === 'large' ? 'text-base' : 'text-sm'} ${
        disabled ? 'text-worker-text-disabled' : ''
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className={`accent-worker-primary ${size === 'large' ? 'w-5 h-5' : 'w-4 h-4'}`}
      />
      {label}
    </label>
  );
}
