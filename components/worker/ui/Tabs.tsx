'use client';

type Tab = { value: string; label: string };

type TabsProps = {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
};

export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div role="tablist" className="flex items-center gap-5 border-b border-worker-border">
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px ${
              active ? 'text-worker-primary border-worker-primary' : 'text-worker-text-secondary border-transparent'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
