'use client';

import { useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { Calendar } from './Calendar';

type DateRange = { start: Date | null; end: Date | null };

type DateRangePickerProps = {
  label?: string;
  value: DateRange;
  onChange: (range: DateRange) => void;
};

function formatDate(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function isInRange(d: Date, range: DateRange) {
  if (!range.start || !range.end) return false;
  return d >= range.start && d <= range.end;
}

export function DateRangePicker({ label = 'Chọn ngày', value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [leftMonth, setLeftMonth] = useState(value.start ?? new Date());
  const rightMonth = new Date(leftMonth.getFullYear(), leftMonth.getMonth() + 1, 1);

  function handleSelect(d: Date) {
    if (!value.start || (value.start && value.end)) {
      onChange({ start: d, end: null });
    } else if (d < value.start) {
      onChange({ start: d, end: value.start });
    } else {
      onChange({ start: value.start, end: d });
    }
  }

  function highlight(d: Date) {
    return isInRange(d, value) ? 'bg-worker-accent' : '';
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex flex-col gap-1 border border-worker-border rounded-md px-3 py-2.5 text-sm text-left w-[280px]"
      >
        <span className="text-xs text-worker-text-secondary">{label}</span>
        <span className="flex items-center justify-between">
          {value.start ? `${formatDate(value.start)}${value.end ? ` - ${formatDate(value.end)}` : ''}` : 'Select a value'}
          <CalendarIcon className="w-4 h-4" />
        </span>
      </button>
      {open && (
        <div className="absolute z-10 mt-2 flex gap-2">
          <Calendar month={leftMonth} onMonthChange={setLeftMonth} selected={value.start} onSelectDate={handleSelect} dayClassName={highlight} />
          <Calendar
            month={rightMonth}
            onMonthChange={(m) => setLeftMonth(new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            selected={value.end}
            onSelectDate={handleSelect}
            dayClassName={highlight}
          />
        </div>
      )}
    </div>
  );
}
