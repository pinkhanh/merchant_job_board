'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

type CalendarProps = {
  month: Date;
  onMonthChange: (date: Date) => void;
  selected?: Date | null;
  onSelectDate: (date: Date) => void;
  dayClassName?: (date: Date) => string;
};

export function Calendar({ month, onMonthChange, selected, onSelectDate, dayClassName }: CalendarProps) {
  const first = startOfMonth(month);
  const leadingBlanks = (first.getDay() + 6) % 7;
  const total = daysInMonth(month);
  const days = Array.from({ length: total }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1));

  return (
    <div className="bg-white rounded-worker-md shadow-worker-card p-4 w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          aria-label="Tháng trước"
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold">
          Tháng {month.getMonth() + 1}/{month.getFullYear()}
        </span>
        <button
          type="button"
          aria-label="Tháng sau"
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-worker-text-secondary mb-1">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {days.map((d) => {
          const isSelected = selected ? isSameDay(d, selected) : false;
          return (
            <button
              type="button"
              key={d.toISOString()}
              onClick={() => onSelectDate(d)}
              className={`w-8 h-8 mx-auto rounded-full ${
                isSelected ? 'bg-worker-primary text-white font-semibold' : 'hover:bg-worker-accent'
              } ${dayClassName?.(d) ?? ''}`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
