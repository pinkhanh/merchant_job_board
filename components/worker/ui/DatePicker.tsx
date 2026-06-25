'use client';

import { useEffect, useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { Calendar } from './Calendar';

type DatePickerProps = {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
};

function formatDate(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function DatePicker({ label = 'Chọn ngày', value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(value ?? new Date());

  useEffect(() => {
    if (value) {
      setMonth(value);
    }
  }, [value]);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex flex-col gap-1 border border-worker-border rounded-md px-3 py-2.5 text-sm text-left w-[240px]"
      >
        <span className="text-xs text-worker-text-secondary">{label}</span>
        <span className="flex items-center justify-between">
          {value ? formatDate(value) : 'Select a value'}
          <CalendarIcon className="w-4 h-4" />
        </span>
      </button>
      {open && (
        <div className="absolute z-10 mt-2">
          <Calendar
            month={month}
            onMonthChange={setMonth}
            selected={value}
            onSelectDate={(d) => {
              onChange(d);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
