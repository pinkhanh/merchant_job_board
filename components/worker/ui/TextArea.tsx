'use client';

type TextAreaProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helpText?: string;
  error?: string;
  disabled?: boolean;
  rows?: number;
};

export function TextArea({ label, value, onChange, placeholder, helpText, error, disabled, rows = 4 }: TextAreaProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="text-xs text-worker-text-secondary">{label}</span>}
      <textarea
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className={`border rounded-md px-3 py-2.5 text-sm disabled:bg-worker-bg disabled:text-worker-text-disabled ${
          error ? 'border-worker-danger' : 'border-worker-border'
        }`}
      />
      {error ? (
        <span className="text-xs text-worker-danger">{error}</span>
      ) : helpText ? (
        <span className="text-xs text-worker-text-secondary">{helpText}</span>
      ) : null}
    </label>
  );
}
