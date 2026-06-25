'use client';

type RadioButtonProps = {
  label: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  size?: 'medium' | 'large';
  disabled?: boolean;
};

export function RadioButton({ label, name, value, checked, onChange, size = 'medium', disabled }: RadioButtonProps) {
  return (
    <label
      className={`flex items-center gap-2 ${size === 'large' ? 'text-base' : 'text-sm'} ${
        disabled ? 'text-worker-text-disabled' : ''
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className={`accent-worker-primary ${size === 'large' ? 'w-5 h-5' : 'w-4 h-4'}`}
      />
      {label}
    </label>
  );
}
