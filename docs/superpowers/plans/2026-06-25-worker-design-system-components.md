# Worker Design System Component Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 22-component, worker-site-only UI library under `components/worker/ui/` based on the MoMo "Mobase" Figma exports, and wire the 6 components that replace existing raw markup into the live worker pages.

**Architecture:** One file per component under `components/worker/ui/`, barrel-exported from `components/worker/ui/index.ts`. Plain React + Tailwind utility classes using the existing `--color-worker-*` / `--radius-worker-*` / `--shadow-worker-*` tokens (plus a few new ones added in Task 1). Icons from the already-installed `@heroicons/react`. No new dependencies.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind v4, TypeScript, Vitest + React Testing Library.

## Global Constraints

- Worker-site only. Never touch `app/admin/**`, `app/merchant/**`, or `Shell.tsx`.
- No new npm dependencies — use existing `@heroicons/react`, plain Tailwind, no `clsx`/`cva` (codebase doesn't use one; follow the template-literal-with-ternary style already in `WorkerHeader.tsx`).
- Spec doc: `docs/superpowers/specs/2026-06-25-worker-design-system-components-design.md` — read it for the full component list and the table of mislabeled Figma export filenames.
- Component fidelity is best-visual-match off PNG exports, not exact Figma values — do not chase pixel-perfection.
- Every component file: function component, named export (not default), typed props object inline (no separate `types.ts`).
- Test command for a single new test file: `npx vitest run tests/components/worker/ui/<Name>.test.tsx`. Full-suite sanity check (excludes a parallel agent's worktree under `.claude/worktrees/`): `npx vitest run --exclude '**/.claude/**'`.
- Commit after every task with `git add` scoped to the exact files touched in that task — never `git add -A`.

---

### Task 1: Worker status color tokens

**Files:**
- Modify: `app/globals.css` (worker `@theme` block, currently lines 39–53)

**Interfaces:**
- Produces: CSS custom properties `--color-worker-warning-bg`, `--color-worker-warning-text`, `--color-worker-info-bg`, `--color-worker-info-text`, `--color-worker-success-bg`, `--color-worker-error-bg`, consumed later by `Notification` (Task 7) and `Callout` (Task 8) via Tailwind classes `bg-worker-warning-bg`, `text-worker-warning-text`, etc.

- [ ] **Step 1: Add the new tokens**

In `app/globals.css`, inside the existing worker `@theme` block (the one starting `--color-worker-primary: #E9349A;`), add these lines right after `--color-worker-success: #34C759;`:

```css
  --color-worker-warning-bg: #FFF4E0;
  --color-worker-warning-text: #B25E00;
  --color-worker-info-bg: #E8F0FE;
  --color-worker-info-text: #1A56DB;
  --color-worker-success-bg: #E3F9E9;
  --color-worker-error-bg: #FDE8E8;
```

- [ ] **Step 2: Sanity-check nothing broke**

Run: `npx vitest run --exclude '**/.claude/**'`
Expected: same pass count as before this change (244 tests / 56 files), no failures — this is a pure CSS addition, no JS/TS touched.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(worker-ui): add warning/info/success/error status color tokens"
```

---

### Task 2: Spinner (+ wire into jobs list loading state)

**Files:**
- Create: `components/worker/ui/Spinner.tsx`
- Create: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/Spinner.test.tsx`
- Modify: `app/jobs/page.tsx`
- Test: `tests/app/jobs-page.test.tsx` (verify still passes, add one case)

**Interfaces:**
- Produces: `Spinner({ variant?: 'spin' | 'dots'; tone?: 'gray' | 'primary' })`, default export style is named export `Spinner`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/Spinner.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Spinner } from '@/components/worker/ui/Spinner';

describe('Spinner', () => {
  it('renders an svg for the default spin variant', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders 3 dots for the dots variant', () => {
    const { container } = render(<Spinner variant="dots" />);
    expect(container.querySelectorAll('span > span').length).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/Spinner.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/Spinner'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/Spinner.tsx`:

```tsx
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
```

Create `components/worker/ui/index.ts`:

```ts
export { Spinner } from './Spinner';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/Spinner.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Wire into `app/jobs/page.tsx`**

In `app/jobs/page.tsx`, add the import and a `loading` flag, then show the spinner while the first fetch is in flight.

Add to the imports at the top:

```tsx
import { Spinner } from '@/components/worker/ui/Spinner';
```

Add a `loading` state next to the other `useState` calls in `JobsPageContent`:

```tsx
const [loading, setLoading] = useState(true);
```

In `load`, set it around the fetch:

```tsx
async function load(forPage: number, append: boolean) {
  if (!append) setLoading(true);
  const res = await fetch(`/api/worker/jobs?${queryString(forPage)}`);
  const body = await res.json();
  setJobs((prev) => (append ? [...prev, ...body.jobs] : body.jobs));
  setTotal(body.total);
  setCounts(body.counts);
  setPage(forPage);
  setLoading(false);
}
```

Change the `jobs.length === 0 ? ... : ...` render block's opening condition to check `loading` first:

```tsx
{loading ? (
  <div className="flex justify-center py-16">
    <Spinner />
  </div>
) : jobs.length === 0 ? (
```

(Keep the existing empty-state and list branches as the `: jobs.length === 0 ? (...) : (...)` chain — only the new `loading ? (...) :` prefix is added.)

- [ ] **Step 6: Run the jobs page test suite**

Run: `npx vitest run tests/app/jobs-page.test.tsx`
Expected: PASS — existing tests use `waitFor`, which already tolerates the transient loading state.

- [ ] **Step 7: Commit**

```bash
git add components/worker/ui/Spinner.tsx components/worker/ui/index.ts tests/components/worker/ui/Spinner.test.tsx app/jobs/page.tsx
git commit -m "feat(worker-ui): add Spinner, show it while the jobs list loads"
```

---

### Task 3: Chips (+ wire into employment-type filter)

**Files:**
- Create: `components/worker/ui/Chips.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/Chips.test.tsx`
- Modify: `app/jobs/page.tsx`

**Interfaces:**
- Produces: `Chips({ label: string; variant?: 'primary' | 'outline' | 'secondary'; size?: 'sm' | 'md'; selected?: boolean; showAdd?: boolean; onRemove?: () => void; onClick?: () => void })`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/Chips.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Chips } from '@/components/worker/ui/Chips';

describe('Chips', () => {
  it('renders the label', () => {
    render(<Chips label="Theo ca (1)" />);
    expect(screen.getByText('Theo ca (1)')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Chips label="Theo ca" onClick={onClick} />);
    fireEvent.click(screen.getByText('Theo ca'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('calls onRemove without bubbling to onClick when the remove icon is clicked', () => {
    const onClick = vi.fn();
    const onRemove = vi.fn();
    render(<Chips label="Hà Nội" onClick={onClick} onRemove={onRemove} />);
    fireEvent.click(screen.getByLabelText('Xóa Hà Nội'));
    expect(onRemove).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/Chips.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/Chips'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/Chips.tsx`:

```tsx
'use client';

import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

type ChipsProps = {
  label: string;
  variant?: 'primary' | 'outline' | 'secondary';
  size?: 'sm' | 'md';
  selected?: boolean;
  showAdd?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
};

const VARIANT_CLASSES: Record<NonNullable<ChipsProps['variant']>, string> = {
  primary: 'bg-worker-primary text-white border-worker-primary',
  outline: 'bg-white text-worker-primary border-worker-primary',
  secondary: 'bg-white text-worker-text-secondary border-worker-border',
};

export function Chips({ label, variant = 'secondary', size = 'md', selected = false, showAdd = false, onRemove, onClick }: ChipsProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 rounded-worker-pill border font-medium ${VARIANT_CLASSES[variant]} ${
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
      } ${selected ? 'ring-2 ring-worker-primary/30' : ''}`}
    >
      {showAdd && <PlusIcon className="w-3.5 h-3.5" />}
      {label}
      {onRemove && (
        <XMarkIcon
          className="w-3.5 h-3.5"
          aria-label={`Xóa ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </button>
  );
}
```

Update `components/worker/ui/index.ts`, add:

```ts
export { Chips } from './Chips';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/Chips.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Wire into `app/jobs/page.tsx`**

Add the import:

```tsx
import { Chips } from '@/components/worker/ui/Chips';
```

Replace the employment-type filter button block:

```tsx
<div className="flex flex-wrap gap-2 mb-4">
  {EMPLOYMENT_TYPES.map((t) => {
    const active = employmentTypes.includes(t.value);
    return (
      <button
        key={t.value}
        onClick={() => toggleEmploymentType(t.value)}
        className={`rounded-worker-pill px-4 py-2 text-sm border ${
          active ? 'bg-worker-accent border-worker-primary text-worker-primary' : 'bg-white border-worker-border'
        }`}
      >
        {t.label} ({counts.employmentType[t.value] ?? 0})
      </button>
    );
  })}
</div>
```

with:

```tsx
<div className="flex flex-wrap gap-2 mb-4">
  {EMPLOYMENT_TYPES.map((t) => (
    <Chips
      key={t.value}
      label={`${t.label} (${counts.employmentType[t.value] ?? 0})`}
      variant={employmentTypes.includes(t.value) ? 'outline' : 'secondary'}
      onClick={() => toggleEmploymentType(t.value)}
    />
  ))}
</div>
```

- [ ] **Step 6: Run the jobs page test suite**

Run: `npx vitest run tests/app/jobs-page.test.tsx`
Expected: PASS — the test asserts on text `'Theo ca (1)'` / `'Bán thời gian (2)'`, which the new `label` string still produces verbatim.

- [ ] **Step 7: Commit**

```bash
git add components/worker/ui/Chips.tsx components/worker/ui/index.ts tests/components/worker/ui/Chips.test.tsx app/jobs/page.tsx
git commit -m "feat(worker-ui): add Chips, use it for the employment-type filter"
```

---

### Task 4: Select (+ wire into salary/industry filters)

**Files:**
- Create: `components/worker/ui/Select.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/Select.test.tsx`
- Modify: `app/jobs/page.tsx`

**Interfaces:**
- Produces: `Select({ label?: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; placeholder?: string; helpText?: string; error?: string; disabled?: boolean })`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/Select.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from '@/components/worker/ui/Select';

const options = [
  { value: '', label: 'Tất cả' },
  { value: 'F&B', label: 'F&B' },
];

describe('Select', () => {
  it('renders the label and options', () => {
    render(<Select label="Ngành nghề" value="" onChange={vi.fn()} options={options} />);
    expect(screen.getByText('Ngành nghề')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'F&B' })).toBeInTheDocument();
  });

  it('calls onChange with the selected value', () => {
    const onChange = vi.fn();
    render(<Select value="" onChange={onChange} options={options} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'F&B' } });
    expect(onChange).toHaveBeenCalledWith('F&B');
  });

  it('shows the error message instead of help text when both are given', () => {
    render(<Select value="" onChange={vi.fn()} options={options} error="Bắt buộc chọn" helpText="Chọn 1 ngành" />);
    expect(screen.getByText('Bắt buộc chọn')).toBeInTheDocument();
    expect(screen.queryByText('Chọn 1 ngành')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/Select.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/Select'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/Select.tsx`:

```tsx
'use client';

import { ChevronDownIcon } from '@heroicons/react/24/outline';

type Option = { value: string; label: string };

type SelectProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  helpText?: string;
  error?: string;
  disabled?: boolean;
};

export function Select({ label, value, onChange, options, placeholder = 'Select a value', helpText, error, disabled }: SelectProps) {
  const hasEmptyOption = options.some((o) => o.value === '');

  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="text-xs text-worker-text-secondary">{label}</span>}
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full appearance-none border rounded-md pl-3 pr-8 py-2.5 text-sm disabled:bg-worker-bg disabled:text-worker-text-disabled ${
            error ? 'border-worker-danger' : 'border-worker-border'
          }`}
        >
          {!hasEmptyOption && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </span>
      {error ? (
        <span className="text-xs text-worker-danger">{error}</span>
      ) : helpText ? (
        <span className="text-xs text-worker-text-secondary">{helpText}</span>
      ) : null}
    </label>
  );
}
```

Update `components/worker/ui/index.ts`, add:

```ts
export { Select } from './Select';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/Select.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Wire into `app/jobs/page.tsx`**

Add the import:

```tsx
import { Select } from '@/components/worker/ui/Select';
```

Replace:

```tsx
<div className="flex flex-wrap gap-3 mb-6">
  <select value={minSalary} onChange={(e) => setMinSalary(e.target.value)} className="border border-worker-border rounded-md px-3 py-2 text-sm">
    <option value="">Tất cả mức lương</option>
    {counts.minSalary.map((b) => (
      <option key={b.threshold} value={b.threshold}>
        ≥ {b.threshold.toLocaleString('vi-VN')} ({b.count})
      </option>
    ))}
  </select>

  <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="border border-worker-border rounded-md px-3 py-2 text-sm">
    <option value="">Tất cả ngành nghề</option>
    {INDUSTRIES.map((i) => (
      <option key={i} value={i}>
        {i} ({counts.industry[i] ?? 0})
      </option>
    ))}
  </select>
</div>
```

with:

```tsx
<div className="flex flex-wrap gap-3 mb-6">
  <Select
    value={minSalary}
    onChange={setMinSalary}
    options={[
      { value: '', label: 'Tất cả mức lương' },
      ...counts.minSalary.map((b) => ({
        value: String(b.threshold),
        label: `≥ ${b.threshold.toLocaleString('vi-VN')} (${b.count})`,
      })),
    ]}
  />

  <Select
    value={industry}
    onChange={setIndustry}
    options={[
      { value: '', label: 'Tất cả ngành nghề' },
      ...INDUSTRIES.map((i) => ({ value: i, label: `${i} (${counts.industry[i] ?? 0})` })),
    ]}
  />
</div>
```

- [ ] **Step 6: Run the jobs page test suite**

Run: `npx vitest run tests/app/jobs-page.test.tsx`
Expected: PASS — no existing test queries these selects directly.

- [ ] **Step 7: Commit**

```bash
git add components/worker/ui/Select.tsx components/worker/ui/index.ts tests/components/worker/ui/Select.test.tsx app/jobs/page.tsx
git commit -m "feat(worker-ui): add Select, use it for the salary/industry filters"
```

---

### Task 5: Avatar (+ wire into merchant logos)

**Files:**
- Create: `components/worker/ui/Avatar.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/Avatar.test.tsx`
- Modify: `app/jobs/page.tsx`
- Modify: `app/jobs/[id]/page.tsx`

**Interfaces:**
- Produces: `Avatar({ variant?: 'text' | 'person' | 'image'; src?: string; alt?: string; text?: string; shape?: 'circle' | 'square'; size?: 24 | 32 | 40 | 48 | 56 | 72 })`. No `'use client'` — purely presentational, no handlers.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/Avatar.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from '@/components/worker/ui/Avatar';

describe('Avatar', () => {
  it('renders an img when variant is image and src is given', () => {
    render(<Avatar variant="image" src="https://cdn.example.com/logo.png" alt="Katinat" />);
    const img = screen.getByRole('img', { name: 'Katinat' });
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/logo.png');
  });

  it('renders no img role for the person variant', () => {
    render(<Avatar variant="person" alt="Katinat" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders the given size as an inline width/height', () => {
    const { container } = render(<Avatar variant="person" size={72} />);
    expect(container.firstChild).toHaveStyle({ width: '72px', height: '72px' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/Avatar.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/Avatar'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/Avatar.tsx`:

```tsx
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
```

Update `components/worker/ui/index.ts`, add:

```ts
export { Avatar } from './Avatar';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/Avatar.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Wire into `app/jobs/page.tsx`**

Add the import:

```tsx
import { Avatar } from '@/components/worker/ui/Avatar';
```

Replace the merchant filter-row avatar block:

```tsx
{m.logoUrl ? (
  <img
    src={m.logoUrl}
    alt={m.brandName}
    className={`w-[72px] h-[72px] rounded-full object-cover ${m.id === merchantId ? 'border-2 border-worker-primary' : ''}`}
  />
) : (
  <div className={`w-[72px] h-[72px] rounded-full bg-worker-accent ${m.id === merchantId ? 'border-2 border-worker-primary' : ''}`} />
)}
```

with:

```tsx
<span className={m.id === merchantId ? 'rounded-full border-2 border-worker-primary' : ''}>
  <Avatar variant={m.logoUrl ? 'image' : 'person'} src={m.logoUrl ?? undefined} alt={m.brandName} size={72} />
</span>
```

Replace the job-card avatar block:

```tsx
{job.merchant.logoUrl ? (
  <img
    src={job.merchant.logoUrl}
    alt={job.merchant.brandName}
    className="w-14 h-14 rounded-full object-cover shrink-0"
  />
) : (
  <div className="w-14 h-14 rounded-full bg-worker-accent shrink-0" />
)}
```

with:

```tsx
<Avatar variant={job.merchant.logoUrl ? 'image' : 'person'} src={job.merchant.logoUrl ?? undefined} alt={job.merchant.brandName} size={56} />
```

- [ ] **Step 6: Wire into `app/jobs/[id]/page.tsx`**

Add the import:

```tsx
import { Avatar } from '@/components/worker/ui/Avatar';
```

Replace:

```tsx
{job.merchant.logoUrl ? (
  <img
    src={job.merchant.logoUrl}
    alt={job.merchant.brandName}
    className="w-8 h-8 rounded-full object-cover shrink-0"
  />
) : (
  <div className="w-8 h-8 rounded-full bg-worker-accent shrink-0" />
)}
```

with:

```tsx
<Avatar variant={job.merchant.logoUrl ? 'image' : 'person'} src={job.merchant.logoUrl ?? undefined} alt={job.merchant.brandName} size={32} />
```

- [ ] **Step 7: Run both page test suites**

Run: `npx vitest run tests/app/jobs-page.test.tsx tests/app/job-detail-page.test.tsx`
Expected: PASS — both already assert `getByRole('img', { name: 'Katinat' })` / `queryByRole('img', ...)).not.toBeInTheDocument()`, which `Avatar`'s `image`/`person` variants satisfy identically to the old markup.

- [ ] **Step 8: Commit**

```bash
git add components/worker/ui/Avatar.tsx components/worker/ui/index.ts tests/components/worker/ui/Avatar.test.tsx app/jobs/page.tsx app/jobs/[id]/page.tsx
git commit -m "feat(worker-ui): add Avatar, use it for merchant logos on jobs list and detail"
```

---

### Task 6: ShowMore (+ wire into "Tải thêm")

**Files:**
- Create: `components/worker/ui/ShowMore.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/ShowMore.test.tsx`
- Modify: `app/jobs/page.tsx`

**Interfaces:**
- Produces: `ShowMore({ onClick: () => void; expanded?: boolean; label?: string; expandedLabel?: string })`. When `expanded` is `undefined`, it behaves as a one-way "load more" link (always shows `label`, chevron-down, no toggle) — this is the mode the worker jobs list uses, since "Tải thêm" only ever loads forward.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/ShowMore.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShowMore } from '@/components/worker/ui/ShowMore';

describe('ShowMore', () => {
  it('renders the default "Xem thêm" label when not in toggle mode', () => {
    render(<ShowMore onClick={vi.fn()} />);
    expect(screen.getByText('Xem thêm')).toBeInTheDocument();
  });

  it('renders a custom label', () => {
    render(<ShowMore onClick={vi.fn()} label="Tải thêm" />);
    expect(screen.getByText('Tải thêm')).toBeInTheDocument();
  });

  it('shows the collapsed label when expanded is true', () => {
    render(<ShowMore onClick={vi.fn()} expanded label="Xem thêm" expandedLabel="Thu gọn" />);
    expect(screen.getByText('Thu gọn')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ShowMore onClick={onClick} label="Tải thêm" />);
    fireEvent.click(screen.getByText('Tải thêm'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/ShowMore.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/ShowMore'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/ShowMore.tsx`:

```tsx
'use client';

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

type ShowMoreProps = {
  onClick: () => void;
  expanded?: boolean;
  label?: string;
  expandedLabel?: string;
};

export function ShowMore({ onClick, expanded, label = 'Xem thêm', expandedLabel = 'Thu gọn' }: ShowMoreProps) {
  const isToggle = expanded !== undefined;
  const text = isToggle && expanded ? expandedLabel : label;
  const Icon = isToggle && expanded ? ChevronUpIcon : ChevronDownIcon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 mx-auto text-sm font-medium text-worker-text-secondary border border-worker-border rounded-worker-pill px-6 py-2.5"
    >
      {text}
      <Icon className="w-4 h-4" />
    </button>
  );
}
```

Update `components/worker/ui/index.ts`, add:

```ts
export { ShowMore } from './ShowMore';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/ShowMore.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Wire into `app/jobs/page.tsx`**

Add the import:

```tsx
import { ShowMore } from '@/components/worker/ui/ShowMore';
```

Replace:

```tsx
{jobs.length < total && (
  <div className="text-center mt-6">
    <button onClick={() => load(page + 1, true)} className="border border-worker-border rounded-worker-pill px-6 py-2.5 text-sm font-medium">
      Tải thêm
    </button>
  </div>
)}
```

with:

```tsx
{jobs.length < total && (
  <div className="text-center mt-6">
    <ShowMore onClick={() => load(page + 1, true)} label="Tải thêm" />
  </div>
)}
```

- [ ] **Step 6: Run the jobs page test suite**

Run: `npx vitest run tests/app/jobs-page.test.tsx`
Expected: PASS — no existing test exercises "Tải thêm", so this is purely additive risk-wise.

- [ ] **Step 7: Commit**

```bash
git add components/worker/ui/ShowMore.tsx components/worker/ui/index.ts tests/components/worker/ui/ShowMore.test.tsx app/jobs/page.tsx
git commit -m "feat(worker-ui): add ShowMore, use it for the jobs list 'Tải thêm' button"
```

---

### Task 7: Notification

**Files:**
- Create: `components/worker/ui/Notification.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/Notification.test.tsx`

**Interfaces:**
- Produces: `Notification({ variant: 'success' | 'warning' | 'error'; title?: string; message: string; linkLabel?: string; onLinkClick?: () => void; onDismiss?: () => void })`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/Notification.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Notification } from '@/components/worker/ui/Notification';

describe('Notification', () => {
  it('renders the title and message', () => {
    render(<Notification variant="success" title="Thành công" message="Nội dung tối đa 2 dòng" />);
    expect(screen.getByText('Thành công')).toBeInTheDocument();
    expect(screen.getByText('Nội dung tối đa 2 dòng')).toBeInTheDocument();
  });

  it('calls onDismiss when the close button is clicked', () => {
    const onDismiss = vi.fn();
    render(<Notification variant="error" message="Lỗi" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByLabelText('Đóng'));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('does not render a close button when onDismiss is not given', () => {
    render(<Notification variant="warning" message="Cảnh báo" />);
    expect(screen.queryByLabelText('Đóng')).not.toBeInTheDocument();
  });

  it('calls onLinkClick when the text link is clicked', () => {
    const onLinkClick = vi.fn();
    render(<Notification variant="success" message="OK" linkLabel="Tắt thông báo" onLinkClick={onLinkClick} />);
    fireEvent.click(screen.getByText('Tắt thông báo'));
    expect(onLinkClick).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/Notification.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/Notification'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/Notification.tsx`:

```tsx
'use client';

import { CheckCircleIcon, ExclamationTriangleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';

type NotificationProps = {
  variant: 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  linkLabel?: string;
  onLinkClick?: () => void;
  onDismiss?: () => void;
};

const ICONS = {
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: ExclamationCircleIcon,
};

const ICON_COLORS: Record<NotificationProps['variant'], string> = {
  success: 'text-worker-success',
  warning: 'text-worker-warning-text',
  error: 'text-worker-danger',
};

export function Notification({ variant, title, message, linkLabel, onLinkClick, onDismiss }: NotificationProps) {
  const Icon = ICONS[variant];

  return (
    <div className="flex items-start gap-2 bg-white rounded-md shadow-worker-modal px-4 py-3 w-[360px]">
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${ICON_COLORS[variant]}`} />
      <div className="flex-1">
        {title && <p className="font-bold text-sm mb-0.5">{title}</p>}
        <p className="text-sm">{message}</p>
        {linkLabel && (
          <button type="button" onClick={onLinkClick} className="text-worker-info-text text-sm mt-1">
            {linkLabel}
          </button>
        )}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Đóng">
          <XMarkIcon className="w-4 h-4 text-worker-text-secondary" />
        </button>
      )}
    </div>
  );
}
```

Update `components/worker/ui/index.ts`, add:

```ts
export { Notification } from './Notification';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/Notification.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/worker/ui/Notification.tsx components/worker/ui/index.ts tests/components/worker/ui/Notification.test.tsx
git commit -m "feat(worker-ui): add Notification"
```

---

### Task 8: Callout (+ wire Notification/Callout into ApplyModal)

**Files:**
- Create: `components/worker/ui/Callout.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/Callout.test.tsx`
- Modify: `components/ApplyModal.tsx`

**Interfaces:**
- Produces: `Callout({ variant: 'neutral' | 'error' | 'success' | 'warning' | 'info'; message: string; actionLabel?: string; onAction?: () => void; disabled?: boolean })`.
- Consumes (from Task 7): `Notification({ variant, title, message })`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/Callout.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Callout } from '@/components/worker/ui/Callout';

describe('Callout', () => {
  it('renders the message', () => {
    render(<Callout variant="neutral" message="Bạn cần cho phép website..." />);
    expect(screen.getByText('Bạn cần cho phép website...')).toBeInTheDocument();
  });

  it('has role="alert" only for the error variant', () => {
    const { rerender } = render(<Callout variant="error" message="Lỗi" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    rerender(<Callout variant="info" message="Thông tin" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls onAction when the action link is clicked', () => {
    const onAction = vi.fn();
    render(<Callout variant="warning" message="Cảnh báo" actionLabel="Upgrade" onAction={onAction} />);
    fireEvent.click(screen.getByText('Upgrade'));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('disables the action when disabled is true', () => {
    render(<Callout variant="neutral" message="Đã tắt" actionLabel="Upgrade" disabled />);
    expect(screen.getByText('Upgrade')).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/Callout.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/Callout'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/Callout.tsx`:

```tsx
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
```

Update `components/worker/ui/index.ts`, add:

```ts
export { Callout } from './Callout';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/Callout.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Wire into `components/ApplyModal.tsx`**

Add the import:

```tsx
import { Notification } from '@/components/worker/ui/Notification';
import { Callout } from '@/components/worker/ui/Callout';
```

Replace the success block's icon line:

```tsx
<CheckCircleIcon className="w-12 h-12 text-worker-success mx-auto mb-3" />
<p className="text-lg font-bold mb-2">Đã gửi hồ sơ!</p>
<p className="text-worker-text-secondary text-sm mb-4">
  Nhà tuyển dụng sẽ liên hệ qua số điện thoại bạn đã cung cấp.
</p>
```

with:

```tsx
<Notification
  variant="success"
  title="Đã gửi hồ sơ!"
  message="Nhà tuyển dụng sẽ liên hệ qua số điện thoại bạn đã cung cấp."
/>
```

(Drop the now-unused `CheckCircleIcon` import from `@heroicons/react/24/outline` at the top of the file if nothing else in the file uses it — check with a quick grep before removing.)

Replace:

```tsx
{error && <p role="alert" className="text-worker-hot text-sm">{error}</p>}
```

with:

```tsx
{error && <Callout variant="error" message={error} />}
```

- [ ] **Step 6: Run the ApplyModal test suite**

Run: `npx vitest run tests/components/ApplyModal.test.tsx`
Expected: PASS — the existing tests assert on the literal strings `'Đã gửi hồ sơ!'` and `'Bạn đã ứng tuyển vào vị trí này rồi.'`, both still rendered verbatim by `Notification`/`Callout`.

- [ ] **Step 7: Commit**

```bash
git add components/worker/ui/Callout.tsx components/worker/ui/index.ts tests/components/worker/ui/Callout.test.tsx components/ApplyModal.tsx
git commit -m "feat(worker-ui): add Callout, use Notification/Callout in ApplyModal"
```

---

### Task 9: Button

**Files:**
- Create: `components/worker/ui/Button.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/Button.test.tsx`

**Interfaces:**
- Produces: `Button({ children: ReactNode; variant?: 'primary' | 'secondary' | 'outline' | 'tonal' | 'danger' | 'transparent'; icon?: ReactNode; loading?: boolean; type?: 'button' | 'submit'; onClick?: () => void; disabled?: boolean })`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/Button.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/worker/ui/Button';

describe('Button', () => {
  it('renders children as the label', () => {
    render(<Button>Tìm việc</Button>);
    expect(screen.getByRole('button', { name: 'Tìm việc' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Đăng tin</Button>);
    fireEvent.click(screen.getByText('Đăng tin'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled and shows a spinner svg when loading', () => {
    render(<Button loading>Đang lưu</Button>);
    const button = screen.getByRole('button', { name: 'Đang lưu' });
    expect(button).toBeDisabled();
    expect(button.querySelector('svg')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/Button.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/Button'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/Button.tsx`:

```tsx
'use client';

import type { ReactNode } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

type ButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'tonal' | 'danger' | 'transparent';
  icon?: ReactNode;
  loading?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
};

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-worker-primary text-white',
  secondary: 'bg-white text-worker-text-secondary border border-worker-border',
  outline: 'bg-white text-worker-primary border border-worker-primary',
  tonal: 'bg-worker-accent text-worker-primary',
  danger: 'bg-worker-danger text-white',
  transparent: 'bg-transparent text-worker-primary',
};

export function Button({ children, variant = 'primary', icon, loading, type = 'button', onClick, disabled }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center justify-center gap-1.5 rounded-worker-pill px-5 py-2.5 text-sm font-bold disabled:opacity-50 ${VARIANT_CLASSES[variant]}`}
    >
      {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
```

Update `components/worker/ui/index.ts`, add:

```ts
export { Button } from './Button';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/Button.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/worker/ui/Button.tsx components/worker/ui/index.ts tests/components/worker/ui/Button.test.tsx
git commit -m "feat(worker-ui): add Button"
```

---

### Task 10: IconButton

**Files:**
- Create: `components/worker/ui/IconButton.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/IconButton.test.tsx`

**Interfaces:**
- Produces: `IconButton({ icon: ReactNode; ariaLabel: string; variant?: 'primary' | 'secondary' | 'outline' | 'tonal' | 'danger'; onClick?: () => void; disabled?: boolean })`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/IconButton.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { IconButton } from '@/components/worker/ui/IconButton';

describe('IconButton', () => {
  it('renders with the given aria-label', () => {
    render(<IconButton icon={<PlusIcon />} ariaLabel="Thêm" onClick={vi.fn()} />);
    expect(screen.getByLabelText('Thêm')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<IconButton icon={<PlusIcon />} ariaLabel="Thêm" onClick={onClick} />);
    fireEvent.click(screen.getByLabelText('Thêm'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled is true', () => {
    render(<IconButton icon={<PlusIcon />} ariaLabel="Thêm" disabled />);
    expect(screen.getByLabelText('Thêm')).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/IconButton.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/IconButton'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/IconButton.tsx`:

```tsx
'use client';

import type { ReactNode } from 'react';

type IconButtonProps = {
  icon: ReactNode;
  ariaLabel: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'tonal' | 'danger';
  onClick?: () => void;
  disabled?: boolean;
};

const VARIANT_CLASSES: Record<NonNullable<IconButtonProps['variant']>, string> = {
  primary: 'bg-worker-primary text-white',
  secondary: 'bg-white text-worker-text-secondary border border-worker-border',
  outline: 'bg-white text-worker-primary border border-worker-primary',
  tonal: 'bg-worker-accent text-worker-primary',
  danger: 'bg-worker-danger text-white',
};

export function IconButton({ icon, ariaLabel, variant = 'primary', onClick, disabled }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center w-9 h-9 rounded-full disabled:opacity-50 [&_svg]:w-4 [&_svg]:h-4 ${VARIANT_CLASSES[variant]}`}
    >
      {icon}
    </button>
  );
}
```

Update `components/worker/ui/index.ts`, add:

```ts
export { IconButton } from './IconButton';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/IconButton.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/worker/ui/IconButton.tsx components/worker/ui/index.ts tests/components/worker/ui/IconButton.test.tsx
git commit -m "feat(worker-ui): add IconButton"
```

---

### Task 11: Breadcrumb

**Files:**
- Create: `components/worker/ui/Breadcrumb.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/Breadcrumb.test.tsx`

**Interfaces:**
- Produces: `Breadcrumb({ items: { label: string; href?: string }[] })`. No `'use client'` — uses `next/link`, no handlers.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/Breadcrumb.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumb } from '@/components/worker/ui/Breadcrumb';

const items = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Việc làm', href: '/jobs' },
  { label: 'Nhân viên pha chế' },
];

describe('Breadcrumb', () => {
  it('renders every item label', () => {
    render(<Breadcrumb items={items} />);
    expect(screen.getByText('Trang chủ')).toBeInTheDocument();
    expect(screen.getByText('Việc làm')).toBeInTheDocument();
    expect(screen.getByText('Nhân viên pha chế')).toBeInTheDocument();
  });

  it('renders non-last items with an href as links', () => {
    render(<Breadcrumb items={items} />);
    expect(screen.getByRole('link', { name: 'Việc làm' })).toHaveAttribute('href', '/jobs');
  });

  it('does not render the last item as a link', () => {
    render(<Breadcrumb items={items} />);
    expect(screen.queryByRole('link', { name: 'Nhân viên pha chế' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/Breadcrumb.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/Breadcrumb'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/Breadcrumb.tsx`:

```tsx
import Link from 'next/link';
import { HomeIcon } from '@heroicons/react/24/outline';

type BreadcrumbItem = { label: string; href?: string };

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm text-worker-text-secondary">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-2">
              {i === 0 && <HomeIcon className="w-4 h-4" />}
              {!isLast && item.href ? (
                <Link href={item.href} className="hover:text-worker-primary">
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
              {!isLast && <span>›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

Update `components/worker/ui/index.ts`, add:

```ts
export { Breadcrumb } from './Breadcrumb';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/Breadcrumb.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/worker/ui/Breadcrumb.tsx components/worker/ui/index.ts tests/components/worker/ui/Breadcrumb.test.tsx
git commit -m "feat(worker-ui): add Breadcrumb"
```

---

### Task 12: Tabs

**Files:**
- Create: `components/worker/ui/Tabs.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/Tabs.test.tsx`

**Interfaces:**
- Produces: `Tabs({ tabs: { value: string; label: string }[]; value: string; onChange: (value: string) => void })`. Simplified from the Figma reference's grouped "Opt 1/Opt 2" rows to a single flat tab row — there's no real nested-tab use case on the worker site to validate the grouped variant against (noted in the spec as an accepted simplification).

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/Tabs.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from '@/components/worker/ui/Tabs';

const tabs = [
  { value: 'a', label: 'Trái tim MoMo' },
  { value: 'b', label: 'Heo đất MoMo' },
];

describe('Tabs', () => {
  it('renders every tab label', () => {
    render(<Tabs tabs={tabs} value="a" onChange={vi.fn()} />);
    expect(screen.getByText('Trái tim MoMo')).toBeInTheDocument();
    expect(screen.getByText('Heo đất MoMo')).toBeInTheDocument();
  });

  it('marks the active tab with aria-selected', () => {
    render(<Tabs tabs={tabs} value="a" onChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'Trái tim MoMo' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Heo đất MoMo' })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange with the clicked tab value', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} value="a" onChange={onChange} />);
    fireEvent.click(screen.getByText('Heo đất MoMo'));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/Tabs.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/Tabs'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/Tabs.tsx`:

```tsx
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
```

Update `components/worker/ui/index.ts`, add:

```ts
export { Tabs } from './Tabs';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/Tabs.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/worker/ui/Tabs.tsx components/worker/ui/index.ts tests/components/worker/ui/Tabs.test.tsx
git commit -m "feat(worker-ui): add Tabs"
```

---

### Task 13: Checkbox

**Files:**
- Create: `components/worker/ui/Checkbox.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/Checkbox.test.tsx`

**Interfaces:**
- Produces: `Checkbox({ label: string; checked: boolean; onChange: (checked: boolean) => void; size?: 'medium' | 'large'; disabled?: boolean })`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/Checkbox.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from '@/components/worker/ui/Checkbox';

describe('Checkbox', () => {
  it('renders the label and reflects the checked state', () => {
    render(<Checkbox label="Bay thẳng" checked onChange={vi.fn()} />);
    expect(screen.getByLabelText('Bay thẳng')).toBeChecked();
  });

  it('calls onChange with the new checked value', () => {
    const onChange = vi.fn();
    render(<Checkbox label="Bay thẳng" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Bay thẳng'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('is disabled when disabled is true', () => {
    render(<Checkbox label="Disable" checked={false} onChange={vi.fn()} disabled />);
    expect(screen.getByLabelText('Disable')).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/Checkbox.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/Checkbox'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/Checkbox.tsx`:

```tsx
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
```

Update `components/worker/ui/index.ts`, add:

```ts
export { Checkbox } from './Checkbox';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/Checkbox.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/worker/ui/Checkbox.tsx components/worker/ui/index.ts tests/components/worker/ui/Checkbox.test.tsx
git commit -m "feat(worker-ui): add Checkbox"
```

---

### Task 14: RadioButton

**Files:**
- Create: `components/worker/ui/RadioButton.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/RadioButton.test.tsx`

**Interfaces:**
- Produces: `RadioButton({ label: string; name: string; value: string; checked: boolean; onChange: (value: string) => void; size?: 'medium' | 'large'; disabled?: boolean })`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/RadioButton.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RadioButton } from '@/components/worker/ui/RadioButton';

describe('RadioButton', () => {
  it('renders checked when checked is true', () => {
    render(<RadioButton label="Nam" name="gender" value="male" checked onChange={vi.fn()} />);
    expect(screen.getByLabelText('Nam')).toBeChecked();
  });

  it('calls onChange with its value when clicked', () => {
    const onChange = vi.fn();
    render(<RadioButton label="Nữ" name="gender" value="female" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Nữ'));
    expect(onChange).toHaveBeenCalledWith('female');
  });

  it('is disabled when disabled is true', () => {
    render(<RadioButton label="Theo giờ" name="shift" value="hourly" checked={false} onChange={vi.fn()} disabled />);
    expect(screen.getByLabelText('Theo giờ')).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/RadioButton.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/RadioButton'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/RadioButton.tsx`:

```tsx
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
```

Update `components/worker/ui/index.ts`, add:

```ts
export { RadioButton } from './RadioButton';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/RadioButton.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/worker/ui/RadioButton.tsx components/worker/ui/index.ts tests/components/worker/ui/RadioButton.test.tsx
git commit -m "feat(worker-ui): add RadioButton"
```

---

### Task 15: SwitchToggle

**Files:**
- Create: `components/worker/ui/SwitchToggle.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/SwitchToggle.test.tsx`

**Interfaces:**
- Produces: `SwitchToggle({ checked: boolean; onChange: (checked: boolean) => void; ariaLabel: string; disabled?: boolean })`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/SwitchToggle.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SwitchToggle } from '@/components/worker/ui/SwitchToggle';

describe('SwitchToggle', () => {
  it('reflects the checked state via aria-checked', () => {
    render(<SwitchToggle checked ariaLabel="Bật thông báo" onChange={vi.fn()} />);
    expect(screen.getByRole('switch', { name: 'Bật thông báo' })).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with the toggled value when clicked', () => {
    const onChange = vi.fn();
    render(<SwitchToggle checked={false} ariaLabel="Bật thông báo" onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('is disabled when disabled is true', () => {
    render(<SwitchToggle checked={false} ariaLabel="Bật thông báo" onChange={vi.fn()} disabled />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/SwitchToggle.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/SwitchToggle'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/SwitchToggle.tsx`:

```tsx
'use client';

type SwitchToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
};

export function SwitchToggle({ checked, onChange, ariaLabel, disabled }: SwitchToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-40 ${
        checked ? 'bg-worker-primary' : 'bg-worker-border'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}
```

Update `components/worker/ui/index.ts`, add:

```ts
export { SwitchToggle } from './SwitchToggle';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/SwitchToggle.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/worker/ui/SwitchToggle.tsx components/worker/ui/index.ts tests/components/worker/ui/SwitchToggle.test.tsx
git commit -m "feat(worker-ui): add SwitchToggle"
```

---

### Task 16: Choicebox

**Files:**
- Create: `components/worker/ui/Choicebox.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/Choicebox.test.tsx`

**Interfaces:**
- Produces: `Choicebox({ children: ReactNode; selected: boolean; onClick: () => void; disabled?: boolean })`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/Choicebox.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Choicebox } from '@/components/worker/ui/Choicebox';

describe('Choicebox', () => {
  it('renders its children', () => {
    render(<Choicebox selected={false} onClick={vi.fn()}>Business Account</Choicebox>);
    expect(screen.getByText('Business Account')).toBeInTheDocument();
  });

  it('reflects selected via aria-pressed', () => {
    render(<Choicebox selected onClick={vi.fn()}>Business Account</Choicebox>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Choicebox selected={false} onClick={onClick}>8-core CPU</Choicebox>);
    fireEvent.click(screen.getByText('8-core CPU'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled is true', () => {
    render(<Choicebox selected={false} onClick={vi.fn()} disabled>2-core CPU</Choicebox>);
    expect(screen.getByText('2-core CPU').closest('button')).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/Choicebox.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/Choicebox'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/Choicebox.tsx`:

```tsx
'use client';

import type { ReactNode } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

type ChoiceboxProps = {
  children: ReactNode;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export function Choicebox({ children, selected, onClick, disabled }: ChoiceboxProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`relative text-left border rounded-md p-3 disabled:opacity-40 ${
        selected ? 'border-worker-primary' : 'border-worker-border'
      }`}
    >
      {selected && <CheckCircleIcon className="w-4 h-4 text-worker-primary absolute top-2 right-2" />}
      {children}
    </button>
  );
}
```

Update `components/worker/ui/index.ts`, add:

```ts
export { Choicebox } from './Choicebox';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/Choicebox.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/worker/ui/Choicebox.tsx components/worker/ui/index.ts tests/components/worker/ui/Choicebox.test.tsx
git commit -m "feat(worker-ui): add Choicebox"
```

---

### Task 17: ProgressBar

**Files:**
- Create: `components/worker/ui/ProgressBar.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/ProgressBar.test.tsx`

**Interfaces:**
- Produces: `ProgressBar({ value: number; size?: 'sm' | 'md' | 'lg'; status?: 'progress' | 'success' | 'disabled' })`. No `'use client'` — purely presentational.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/ProgressBar.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '@/components/worker/ui/ProgressBar';

describe('ProgressBar', () => {
  it('sets aria-valuenow to the given value', () => {
    render(<ProgressBar value={40} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');
  });

  it('clamps values above 100', () => {
    render(<ProgressBar value={150} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('clamps negative values to 0', () => {
    render(<ProgressBar value={-10} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/ProgressBar.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/ProgressBar'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/ProgressBar.tsx`:

```tsx
type ProgressBarProps = {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  status?: 'progress' | 'success' | 'disabled';
};

const HEIGHTS: Record<NonNullable<ProgressBarProps['size']>, string> = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
};

const FILL_COLORS: Record<NonNullable<ProgressBarProps['status']>, string> = {
  progress: 'bg-worker-primary',
  success: 'bg-worker-success',
  disabled: 'bg-worker-text-disabled',
};

export function ProgressBar({ value, size = 'md', status = 'progress' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full rounded-full bg-worker-border overflow-hidden ${HEIGHTS[size]}`}
    >
      <div className={`h-full rounded-full ${FILL_COLORS[status]}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
```

Update `components/worker/ui/index.ts`, add:

```ts
export { ProgressBar } from './ProgressBar';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/ProgressBar.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/worker/ui/ProgressBar.tsx components/worker/ui/index.ts tests/components/worker/ui/ProgressBar.test.tsx
git commit -m "feat(worker-ui): add ProgressBar"
```

---

### Task 18: TextInput

**Files:**
- Create: `components/worker/ui/TextInput.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/TextInput.test.tsx`

**Interfaces:**
- Produces: `TextInput({ label?: string; value: string; onChange: (value: string) => void; placeholder?: string; helpText?: string; error?: string; disabled?: boolean; type?: string })`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/TextInput.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextInput } from '@/components/worker/ui/TextInput';

describe('TextInput', () => {
  it('renders the label and current value', () => {
    render(<TextInput label="Tên vị trí" value="Pha chế" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Tên vị trí')).toHaveValue('Pha chế');
  });

  it('calls onChange with the typed value', () => {
    const onChange = vi.fn();
    render(<TextInput label="Tên vị trí" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Tên vị trí'), { target: { value: 'Thu ngân' } });
    expect(onChange).toHaveBeenCalledWith('Thu ngân');
  });

  it('shows the error message instead of help text when both are given', () => {
    render(<TextInput label="Email" value="" onChange={vi.fn()} error="Email không hợp lệ" helpText="Dùng email công ty" />);
    expect(screen.getByText('Email không hợp lệ')).toBeInTheDocument();
    expect(screen.queryByText('Dùng email công ty')).not.toBeInTheDocument();
  });

  it('is disabled when disabled is true', () => {
    render(<TextInput label="Disabled" value="" onChange={vi.fn()} disabled />);
    expect(screen.getByLabelText('Disabled')).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/TextInput.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/TextInput'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/TextInput.tsx`:

```tsx
'use client';

type TextInputProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helpText?: string;
  error?: string;
  disabled?: boolean;
  type?: string;
};

export function TextInput({ label, value, onChange, placeholder, helpText, error, disabled, type = 'text' }: TextInputProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="text-xs text-worker-text-secondary">{label}</span>}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
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
```

Update `components/worker/ui/index.ts`, add:

```ts
export { TextInput } from './TextInput';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/TextInput.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/worker/ui/TextInput.tsx components/worker/ui/index.ts tests/components/worker/ui/TextInput.test.tsx
git commit -m "feat(worker-ui): add TextInput"
```

---

### Task 19: TextArea

**Files:**
- Create: `components/worker/ui/TextArea.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/TextArea.test.tsx`

**Interfaces:**
- Produces: `TextArea({ label?: string; value: string; onChange: (value: string) => void; placeholder?: string; helpText?: string; error?: string; disabled?: boolean; rows?: number })`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/TextArea.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextArea } from '@/components/worker/ui/TextArea';

describe('TextArea', () => {
  it('renders the label and current value', () => {
    render(<TextArea label="Mô tả" value="Dù cho mưa sương" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Mô tả')).toHaveValue('Dù cho mưa sương');
  });

  it('calls onChange with the typed value', () => {
    const onChange = vi.fn();
    render(<TextArea label="Mô tả" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Mô tả'), { target: { value: 'cuộc đời' } });
    expect(onChange).toHaveBeenCalledWith('cuộc đời');
  });

  it('shows the error message instead of help text when both are given', () => {
    render(<TextArea label="Mô tả" value="" onChange={vi.fn()} error="Bắt buộc" helpText="Tối đa 500 ký tự" />);
    expect(screen.getByText('Bắt buộc')).toBeInTheDocument();
    expect(screen.queryByText('Tối đa 500 ký tự')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/TextArea.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/TextArea'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/TextArea.tsx`:

```tsx
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
```

Update `components/worker/ui/index.ts`, add:

```ts
export { TextArea } from './TextArea';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/TextArea.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/worker/ui/TextArea.tsx components/worker/ui/index.ts tests/components/worker/ui/TextArea.test.tsx
git commit -m "feat(worker-ui): add TextArea"
```

---

### Task 20: SearchBar

**Files:**
- Create: `components/worker/ui/SearchBar.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/SearchBar.test.tsx`

**Interfaces:**
- Produces: `SearchBar({ value: string; onChange: (value: string) => void; placeholder?: string; disabled?: boolean })`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/SearchBar.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '@/components/worker/ui/SearchBar';

describe('SearchBar', () => {
  it('renders the placeholder when empty', () => {
    render(<SearchBar value="" onChange={vi.fn()} placeholder="Bạn cần tìm gì ...." />);
    expect(screen.getByPlaceholderText('Bạn cần tìm gì ....')).toBeInTheDocument();
  });

  it('calls onChange with the typed value', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'pha chế' } });
    expect(onChange).toHaveBeenCalledWith('pha chế');
  });

  it('shows a clear button only when there is a value, and clears it on click', () => {
    const onChange = vi.fn();
    render(<SearchBar value="pha chế" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Xóa'));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('does not show a clear button when empty', () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.queryByLabelText('Xóa')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/SearchBar.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/SearchBar'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/SearchBar.tsx`:

```tsx
'use client';

import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function SearchBar({ value, onChange, placeholder = 'Bạn cần tìm gì ....', disabled }: SearchBarProps) {
  return (
    <div
      className={`flex items-center gap-2 border rounded-md px-3 py-2.5 ${
        disabled ? 'bg-worker-bg border-worker-border' : 'border-worker-border'
      }`}
    >
      <MagnifyingGlassIcon className="w-4 h-4 text-worker-text-secondary shrink-0" />
      <input
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-sm outline-none disabled:bg-transparent disabled:text-worker-text-disabled"
      />
      {value && (
        <button type="button" aria-label="Xóa" onClick={() => onChange('')}>
          <XMarkIcon className="w-4 h-4 text-worker-text-secondary" />
        </button>
      )}
    </div>
  );
}
```

Update `components/worker/ui/index.ts`, add:

```ts
export { SearchBar } from './SearchBar';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/SearchBar.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/worker/ui/SearchBar.tsx components/worker/ui/index.ts tests/components/worker/ui/SearchBar.test.tsx
git commit -m "feat(worker-ui): add SearchBar"
```

---

### Task 21: MultiSelect

**Files:**
- Create: `components/worker/ui/MultiSelect.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/MultiSelect.test.tsx`

**Interfaces:**
- Produces: `MultiSelect({ label?: string; values: string[]; onChange: (values: string[]) => void; options: { value: string; label: string }[]; placeholder?: string })`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/MultiSelect.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultiSelect } from '@/components/worker/ui/MultiSelect';

const options = [
  { value: 'hcm', label: 'Hồ Chí Minh' },
  { value: 'hn', label: 'Hà Nội' },
];

describe('MultiSelect', () => {
  it('shows the placeholder when no values are selected', () => {
    render(<MultiSelect values={[]} onChange={vi.fn()} options={options} placeholder="Select a value" />);
    expect(screen.getByText('Select a value')).toBeInTheDocument();
  });

  it('renders a removable chip for each selected value', () => {
    render(<MultiSelect values={['hcm']} onChange={vi.fn()} options={options} />);
    expect(screen.getByText('Hồ Chí Minh')).toBeInTheDocument();
  });

  it('opens the option list and adds a value on click', () => {
    const onChange = vi.fn();
    render(<MultiSelect values={[]} onChange={onChange} options={options} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Hà Nội'));
    expect(onChange).toHaveBeenCalledWith(['hn']);
  });

  it('removes a value when its chip is clicked', () => {
    const onChange = vi.fn();
    render(<MultiSelect values={['hcm', 'hn']} onChange={onChange} options={options} />);
    fireEvent.click(screen.getByLabelText('Xóa Hồ Chí Minh'));
    expect(onChange).toHaveBeenCalledWith(['hn']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/MultiSelect.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/MultiSelect'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/MultiSelect.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { ChevronDownIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

type Option = { value: string; label: string };

type MultiSelectProps = {
  label?: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: Option[];
  placeholder?: string;
};

export function MultiSelect({ label, values, onChange, options, placeholder = 'Select a value' }: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  function toggle(value: string) {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  }

  return (
    <div className="relative flex flex-col gap-1 text-sm w-[260px]">
      {label && <span className="text-xs text-worker-text-secondary">{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-2 border border-worker-border rounded-md px-3 py-2 min-h-[40px] flex-wrap"
      >
        <span className="flex flex-wrap gap-1 flex-1">
          {values.length === 0 && <span className="text-worker-text-disabled">{placeholder}</span>}
          {values.map((v) => {
            const opt = options.find((o) => o.value === v);
            return (
              <span
                key={v}
                className="flex items-center gap-1 bg-worker-accent text-worker-primary rounded-worker-pill px-2 py-0.5 text-xs"
              >
                {opt?.label ?? v}
                <XMarkIcon
                  className="w-3 h-3 cursor-pointer"
                  aria-label={`Xóa ${opt?.label ?? v}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(v);
                  }}
                />
              </span>
            );
          })}
        </span>
        <ChevronDownIcon className="w-4 h-4 shrink-0" />
      </button>
      {open && (
        <ul className="absolute top-full mt-1 left-0 right-0 bg-white border border-worker-border rounded-md shadow-worker-card py-1 z-10 max-h-[240px] overflow-y-auto">
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => toggle(o.value)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-worker-bg"
              >
                {o.label}
                {values.includes(o.value) && <CheckIcon className="w-4 h-4 text-worker-primary" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

Note: clicking the `XMarkIcon` inside the trigger `<button>` works in jsdom/RTL because `fireEvent.click` dispatches directly on the target element and `stopPropagation` prevents the outer button's `onClick` (the open/close toggle) from also firing — both behaviors are exercised by the test above.

Update `components/worker/ui/index.ts`, add:

```ts
export { MultiSelect } from './MultiSelect';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/MultiSelect.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/worker/ui/MultiSelect.tsx components/worker/ui/index.ts tests/components/worker/ui/MultiSelect.test.tsx
git commit -m "feat(worker-ui): add MultiSelect"
```

---

### Task 22: CommandSearch

**Files:**
- Create: `components/worker/ui/CommandSearch.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/CommandSearch.test.tsx`

**Interfaces:**
- Produces: `CommandSearch({ query: string; onQueryChange: (query: string) => void; options: { value: string; label: string }[]; selected?: string; onSelect: (value: string) => void; placeholder?: string })`. Implemented as a plain controlled filter-as-you-type list (no `cmdk` dependency) — the Figma reference shows only the visual, not behavior requiring virtualization or full keyboard navigation.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/CommandSearch.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandSearch } from '@/components/worker/ui/CommandSearch';

const options = [
  { value: 'hcm', label: 'Hồ Chí Minh' },
  { value: 'dl', label: 'Đà Lạt' },
];

describe('CommandSearch', () => {
  it('renders every option when the query is empty', () => {
    render(<CommandSearch query="" onQueryChange={vi.fn()} options={options} onSelect={vi.fn()} />);
    expect(screen.getByText('Hồ Chí Minh')).toBeInTheDocument();
    expect(screen.getByText('Đà Lạt')).toBeInTheDocument();
  });

  it('filters options by the query, case-insensitively', () => {
    render(<CommandSearch query="đà" onQueryChange={vi.fn()} options={options} onSelect={vi.fn()} />);
    expect(screen.queryByText('Hồ Chí Minh')).not.toBeInTheDocument();
    expect(screen.getByText('Đà Lạt')).toBeInTheDocument();
  });

  it('calls onQueryChange when typing', () => {
    const onQueryChange = vi.fn();
    render(<CommandSearch query="" onQueryChange={onQueryChange} options={options} onSelect={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hcm' } });
    expect(onQueryChange).toHaveBeenCalledWith('hcm');
  });

  it('calls onSelect with the clicked option value', () => {
    const onSelect = vi.fn();
    render(<CommandSearch query="" onQueryChange={vi.fn()} options={options} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Đà Lạt'));
    expect(onSelect).toHaveBeenCalledWith('dl');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/CommandSearch.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/CommandSearch'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/CommandSearch.tsx`:

```tsx
'use client';

import { MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';

type Option = { value: string; label: string };

type CommandSearchProps = {
  query: string;
  onQueryChange: (query: string) => void;
  options: Option[];
  selected?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
};

export function CommandSearch({ query, onQueryChange, options, selected, onSelect, placeholder = 'Chọn địa điểm' }: CommandSearchProps) {
  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="bg-white rounded-md shadow-worker-card w-[280px] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-worker-border">
        <MagnifyingGlassIcon className="w-4 h-4 text-worker-text-secondary" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-sm outline-none"
        />
      </div>
      <ul className="max-h-[280px] overflow-y-auto py-1">
        {filtered.map((o) => (
          <li key={o.value}>
            <button
              type="button"
              onClick={() => onSelect(o.value)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-worker-bg"
            >
              {o.label}
              {selected === o.value && <CheckIcon className="w-4 h-4 text-worker-primary" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

Update `components/worker/ui/index.ts`, add:

```ts
export { CommandSearch } from './CommandSearch';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/CommandSearch.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/worker/ui/CommandSearch.tsx components/worker/ui/index.ts tests/components/worker/ui/CommandSearch.test.tsx
git commit -m "feat(worker-ui): add CommandSearch"
```

---

### Task 23: Calendar

**Files:**
- Create: `components/worker/ui/Calendar.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/Calendar.test.tsx`

**Interfaces:**
- Produces: `Calendar({ month: Date; onMonthChange: (date: Date) => void; selected?: Date | null; onSelectDate: (date: Date) => void; dayClassName?: (date: Date) => string })`. Simplified from the Figma reference's 4 modes (plain / lunar / price / lunar+price) to plain-only — there's no lunar-calendar or pricing data source anywhere in this codebase to back the other 3 modes (accepted simplification, noted in the spec). `dayClassName` is the escape hatch `DatePicker`/`DateRangePicker` (Tasks 24–25) use for range highlighting.

**Note on dates:** all date math is local-time, no timezone library — consistent with the rest of the codebase (e.g. `app/merchant/jobs/new/page.tsx`'s plain `<input type="date">` usage).

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/Calendar.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Calendar } from '@/components/worker/ui/Calendar';

describe('Calendar', () => {
  it('renders the month/year header', () => {
    render(<Calendar month={new Date(2024, 8, 1)} onMonthChange={vi.fn()} onSelectDate={vi.fn()} />);
    expect(screen.getByText('Tháng 9/2024')).toBeInTheDocument();
  });

  it('renders a button for each day of the month', () => {
    render(<Calendar month={new Date(2024, 8, 1)} onMonthChange={vi.fn()} onSelectDate={vi.fn()} />);
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.queryByText('31')).not.toBeInTheDocument();
  });

  it('calls onSelectDate when a day is clicked', () => {
    const onSelectDate = vi.fn();
    render(<Calendar month={new Date(2024, 8, 1)} onMonthChange={vi.fn()} onSelectDate={onSelectDate} />);
    fireEvent.click(screen.getByText('15'));
    expect(onSelectDate).toHaveBeenCalledWith(new Date(2024, 8, 15));
  });

  it('calls onMonthChange with the next month when the next button is clicked', () => {
    const onMonthChange = vi.fn();
    render(<Calendar month={new Date(2024, 8, 1)} onMonthChange={onMonthChange} onSelectDate={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Tháng sau'));
    expect(onMonthChange).toHaveBeenCalledWith(new Date(2024, 9, 1));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/Calendar.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/Calendar'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/Calendar.tsx`:

```tsx
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
```

Update `components/worker/ui/index.ts`, add:

```ts
export { Calendar } from './Calendar';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/Calendar.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/worker/ui/Calendar.tsx components/worker/ui/index.ts tests/components/worker/ui/Calendar.test.tsx
git commit -m "feat(worker-ui): add Calendar"
```

---

### Task 24: DatePicker

**Files:**
- Create: `components/worker/ui/DatePicker.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/DatePicker.test.tsx`

**Interfaces:**
- Consumes (from Task 23): `Calendar({ month, onMonthChange, selected, onSelectDate, dayClassName })`.
- Produces: `DatePicker({ label?: string; value: Date | null; onChange: (date: Date) => void })`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/DatePicker.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatePicker } from '@/components/worker/ui/DatePicker';

describe('DatePicker', () => {
  it('shows "Select a value" when no date is chosen', () => {
    render(<DatePicker value={null} onChange={vi.fn()} />);
    expect(screen.getByText('Select a value')).toBeInTheDocument();
  });

  it('shows the formatted date when one is chosen', () => {
    render(<DatePicker value={new Date(2024, 8, 15)} onChange={vi.fn()} />);
    expect(screen.getByText('15/09/2024')).toBeInTheDocument();
  });

  it('opens the calendar popover when the trigger is clicked', () => {
    render(<DatePicker value={null} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Select a value'));
    expect(screen.getByLabelText('Tháng sau')).toBeInTheDocument();
  });

  it('calls onChange and closes the popover when a day is picked', () => {
    const onChange = vi.fn();
    render(<DatePicker value={new Date(2024, 8, 1)} onChange={onChange} />);
    fireEvent.click(screen.getByText('01/09/2024'));
    fireEvent.click(screen.getByText('15'));
    expect(onChange).toHaveBeenCalledWith(new Date(2024, 8, 15));
    expect(screen.queryByLabelText('Tháng sau')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/DatePicker.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/DatePicker'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/DatePicker.tsx`:

```tsx
'use client';

import { useState } from 'react';
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
```

Update `components/worker/ui/index.ts`, add:

```ts
export { DatePicker } from './DatePicker';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/DatePicker.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/worker/ui/DatePicker.tsx components/worker/ui/index.ts tests/components/worker/ui/DatePicker.test.tsx
git commit -m "feat(worker-ui): add DatePicker"
```

---

### Task 25: DateRangePicker

**Files:**
- Create: `components/worker/ui/DateRangePicker.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/DateRangePicker.test.tsx`

**Interfaces:**
- Consumes (from Task 23): `Calendar({ month, onMonthChange, selected, onSelectDate, dayClassName })`.
- Produces: `DateRangePicker({ label?: string; value: { start: Date | null; end: Date | null }; onChange: (range: { start: Date | null; end: Date | null }) => void })`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/DateRangePicker.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateRangePicker } from '@/components/worker/ui/DateRangePicker';

describe('DateRangePicker', () => {
  it('shows "Select a value" when no range is chosen', () => {
    render(<DateRangePicker value={{ start: null, end: null }} onChange={vi.fn()} />);
    expect(screen.getByText('Select a value')).toBeInTheDocument();
  });

  it('shows both formatted dates when a full range is chosen', () => {
    render(<DateRangePicker value={{ start: new Date(2024, 8, 7), end: new Date(2024, 8, 28) }} onChange={vi.fn()} />);
    expect(screen.getByText('07/09/2024 - 28/09/2024')).toBeInTheDocument();
  });

  it('opens two calendars side by side when the trigger is clicked', () => {
    render(<DateRangePicker value={{ start: new Date(2024, 8, 1), end: null }} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('01/09/2024'));
    expect(screen.getAllByLabelText('Tháng sau').length).toBe(2);
  });

  it('starts a new range when picking a date after a complete range is already set', () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker value={{ start: new Date(2024, 8, 7), end: new Date(2024, 8, 28) }} onChange={onChange} />
    );
    fireEvent.click(screen.getByText('07/09/2024 - 28/09/2024'));
    fireEvent.click(screen.getAllByText('12')[0]);
    expect(onChange).toHaveBeenCalledWith({ start: new Date(2024, 8, 12), end: null });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/DateRangePicker.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/DateRangePicker'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/DateRangePicker.tsx`:

```tsx
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
```

Update `components/worker/ui/index.ts`, add:

```ts
export { DateRangePicker } from './DateRangePicker';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/DateRangePicker.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/worker/ui/DateRangePicker.tsx components/worker/ui/index.ts tests/components/worker/ui/DateRangePicker.test.tsx
git commit -m "feat(worker-ui): add DateRangePicker"
```

---

### Task 26: AlertDialog

**Files:**
- Create: `components/worker/ui/AlertDialog.tsx`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/AlertDialog.test.tsx`

**Interfaces:**
- Produces: `AlertDialog({ title: string; message: string; cancelLabel?: string; confirmLabel: string; onCancel?: () => void; onConfirm: () => void })`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/AlertDialog.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertDialog } from '@/components/worker/ui/AlertDialog';

describe('AlertDialog', () => {
  it('renders the title and message', () => {
    render(
      <AlertDialog title="Bạn đợi một chút nhé" message="Hệ thống đang bảo trì." confirmLabel="Liên hệ hỗ trợ" onConfirm={vi.fn()} />
    );
    expect(screen.getByText('Bạn đợi một chút nhé')).toBeInTheDocument();
    expect(screen.getByText('Hệ thống đang bảo trì.')).toBeInTheDocument();
  });

  it('has the alertdialog role', () => {
    render(<AlertDialog title="T" message="M" confirmLabel="OK" onConfirm={vi.fn()} />);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('calls onConfirm when the confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<AlertDialog title="T" message="M" confirmLabel="Liên hệ hỗ trợ" onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('Liên hệ hỗ trợ'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('renders the cancel button only when onCancel is given', () => {
    const onCancel = vi.fn();
    render(<AlertDialog title="T" message="M" confirmLabel="OK" cancelLabel="Đóng" onCancel={onCancel} onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByText('Đóng'));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/AlertDialog.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/AlertDialog'`

- [ ] **Step 3: Write the component**

Create `components/worker/ui/AlertDialog.tsx`:

```tsx
'use client';

type AlertDialogProps = {
  title: string;
  message: string;
  cancelLabel?: string;
  confirmLabel: string;
  onCancel?: () => void;
  onConfirm: () => void;
};

export function AlertDialog({ title, message, cancelLabel = 'Đóng', confirmLabel, onCancel, onConfirm }: AlertDialogProps) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="worker-alert-dialog-title"
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-30"
    >
      <div className="bg-white rounded-worker-md shadow-worker-modal p-5 w-[400px]">
        <h2 id="worker-alert-dialog-title" className="font-bold mb-2">
          {title}
        </h2>
        <p className="text-sm text-worker-text-secondary mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="border border-worker-border rounded-md px-4 py-2 text-sm font-semibold">
              {cancelLabel}
            </button>
          )}
          <button type="button" onClick={onConfirm} className="bg-worker-primary text-white rounded-md px-4 py-2 text-sm font-semibold">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

Update `components/worker/ui/index.ts`, add:

```ts
export { AlertDialog } from './AlertDialog';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/AlertDialog.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/worker/ui/AlertDialog.tsx components/worker/ui/index.ts tests/components/worker/ui/AlertDialog.test.tsx
git commit -m "feat(worker-ui): add AlertDialog"
```

---

### Task 27: headingStyles

**Files:**
- Create: `components/worker/ui/headingStyles.ts`
- Modify: `components/worker/ui/index.ts`
- Test: `tests/components/worker/ui/headingStyles.test.tsx`

**Interfaces:**
- Produces: `headingStyles: { page: string; sub: string }`. Not a component — the Figma "Heading Group" reference is a typography sample (page title + colored sub-heading), with no shared structural markup worth wrapping in a component, so this ships as exported Tailwind class strings instead.

- [ ] **Step 1: Write the failing test**

Create `tests/components/worker/ui/headingStyles.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { headingStyles } from '@/components/worker/ui/headingStyles';

describe('headingStyles', () => {
  it('exports a page and sub style string', () => {
    expect(typeof headingStyles.page).toBe('string');
    expect(typeof headingStyles.sub).toBe('string');
  });

  it('the page style includes the worker primary color class', () => {
    expect(headingStyles.page).toContain('worker-primary');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/worker/ui/headingStyles.test.tsx`
Expected: FAIL — `Cannot find module '@/components/worker/ui/headingStyles'`

- [ ] **Step 3: Write the module**

Create `components/worker/ui/headingStyles.ts`:

```ts
export const headingStyles = {
  page: 'text-2xl font-extrabold text-worker-primary',
  sub: 'text-sm text-worker-text-secondary',
};
```

Update `components/worker/ui/index.ts`, add:

```ts
export { headingStyles } from './headingStyles';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/worker/ui/headingStyles.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/worker/ui/headingStyles.ts components/worker/ui/index.ts tests/components/worker/ui/headingStyles.test.tsx
git commit -m "feat(worker-ui): add headingStyles"
```

---

### Task 28: Full-suite verification

**Files:** none (verification only)

- [ ] **Step 1: Run the entire project test suite**

Run: `npx vitest run --exclude '**/.claude/**'`
Expected: PASS — all worker UI component tests (27 files under `tests/components/worker/ui/`) plus every pre-existing test, including the 3 already-touched suites (`tests/app/jobs-page.test.tsx`, `tests/app/job-detail-page.test.tsx`, `tests/components/ApplyModal.test.tsx`).

- [ ] **Step 2: Confirm the barrel exports everything**

Run: `cat components/worker/ui/index.ts` (or open the file) and check it has exactly 23 export lines — one per component built in Tasks 2–27 minus the wiring-only tasks (Spinner, Chips, Select, Avatar, ShowMore, Notification, Callout, Button, IconButton, Breadcrumb, Tabs, Checkbox, RadioButton, SwitchToggle, Choicebox, ProgressBar, TextInput, TextArea, SearchBar, MultiSelect, CommandSearch, Calendar, DatePicker, DateRangePicker, AlertDialog, headingStyles — 26 total).

- [ ] **Step 3: Manual check in the dev server**

Run: `npm run dev`, then open `/jobs` and `/jobs/[id]` for an existing job in a browser. Confirm: filters, merchant avatars, "Tải thêm", and the apply flow's success/error states all look the same as before this plan (componentization should be visually invisible on these two pages — only `Notification`/`Callout` introduce minor new visual chrome on `ApplyModal`'s success/error states, which is expected per the design spec).

- [ ] **Step 4: Final commit**

If step 3 surfaces no changes needed, there's nothing left to commit — this task is verification-only. If it does surface a fix, make it, re-run step 1, and commit that fix on its own with a message describing what was wrong.
