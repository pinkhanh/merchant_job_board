# Merchant Logout, List Pagination, and Store Search/Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a logout control to the shared header, server-side page-based pagination (10/page) to the merchant job-posts and applicants lists, and keyword/city/district search with load-more pagination to the store list used in the job wizard and merchant profile page.

**Architecture:** Each list-bearing service function (`listJobPosts`, `listApplications`, `listStores`) gains a `page` filter and returns `{ items, total }` instead of a bare array, computed via Prisma `skip`/`take` plus a parallel `count` query. A shared `<Pagination>` component renders numbered-page UI for the two "jump to page" lists (job posts, applicants). A shared `useStoreSearch` hook + `<StoreFilterBar>` component drive the two "load more" store lists (job wizard, profile page). Logout reuses the existing `/api/auth/logout` route, adding only a header UI trigger.

**Tech Stack:** Next.js 16 (App Router), Prisma 7 (`@prisma/adapter-pg`), Zod, Vitest + @testing-library/react, Tailwind.

## Global Constraints

- Page size for all 3 paginated lists (job posts, applicants, stores) is fixed at 10 — never user-configurable.
- `lib/constants/pagination.ts`'s `PAGE_SIZE` constant is the single source of truth; no list hardcodes `10` separately.
- `exportApplicationsCsv` must keep exporting the full, unpaginated set — do not break this when changing `listApplications`.
- Existing auth checks (`session.role !== 'merchant'` → 401) on every merchant API route stay unchanged.
- No changes to admin-side (`/admin/*`) routes, services, or pages.
- No changes to `components/WorkerHeader.tsx` or its own hardcoded `CITIES` map.

---

### Task 1: Shared pagination constant + `<Pagination>` component

**Files:**
- Create: `lib/constants/pagination.ts`
- Create: `components/Pagination.tsx`
- Test: `tests/components/Pagination.test.tsx`

**Interfaces:**
- Produces: `PAGE_SIZE: number` (from `lib/constants/pagination.ts`); `Pagination` component with props `{ page: number; pageSize: number; total: number; itemLabel: string; onPageChange: (page: number) => void }`.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/Pagination.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '@/components/Pagination';

describe('Pagination', () => {
  it('shows the current count and total', () => {
    render(<Pagination page={1} pageSize={10} total={25} itemLabel="tin" onPageChange={vi.fn()} />);
    expect(screen.getByText('Hiển thị 10 trên 25 tin')).toBeInTheDocument();
  });

  it('shows the correct count on the last partial page', () => {
    render(<Pagination page={3} pageSize={10} total={25} itemLabel="tin" onPageChange={vi.fn()} />);
    expect(screen.getByText('Hiển thị 5 trên 25 tin')).toBeInTheDocument();
  });

  it('renders a button per page and highlights the current page', () => {
    render(<Pagination page={2} pageSize={10} total={25} itemLabel="tin" onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: '1' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
  });

  it('disables the prev button on the first page and enables next', () => {
    render(<Pagination page={1} pageSize={10} total={25} itemLabel="tin" onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('Trang trước')).toBeDisabled();
    expect(screen.getByLabelText('Trang sau')).not.toBeDisabled();
  });

  it('disables the next button on the last page', () => {
    render(<Pagination page={3} pageSize={10} total={25} itemLabel="tin" onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('Trang sau')).toBeDisabled();
  });

  it('calls onPageChange with the clicked page number', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageSize={10} total={25} itemLabel="tin" onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('only shows a window of 5 page numbers when there are many pages', () => {
    render(<Pagination page={6} pageSize={10} total={200} itemLabel="tin" onPageChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '8' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '9' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/components/Pagination.test.tsx`
Expected: FAIL — `Cannot find module '@/components/Pagination'`

- [ ] **Step 3: Create the shared page-size constant**

```ts
// lib/constants/pagination.ts
export const PAGE_SIZE = 10;
```

- [ ] **Step 4: Implement the `Pagination` component**

```tsx
// components/Pagination.tsx
'use client';

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, pageSize, total, itemLabel, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const shownCount = total === 0 ? 0 : Math.min(pageSize, total - (page - 1) * pageSize);

  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-text-secondary">
        Hiển thị {shownCount} trên {total} {itemLabel}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Trang trước"
          className="w-8 h-8 flex items-center justify-center rounded-md border border-border disabled:opacity-40"
        >
          ‹
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${
              p === page ? 'bg-primary text-white font-semibold' : 'border border-border text-text-secondary'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Trang sau"
          className="w-8 h-8 flex items-center justify-center rounded-md border border-border disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/components/Pagination.test.tsx`
Expected: PASS (7 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/constants/pagination.ts components/Pagination.tsx tests/components/Pagination.test.tsx
git commit -m "feat: add shared PAGE_SIZE constant and Pagination component"
```

---

### Task 2: Logout control in the shared header

**Files:**
- Modify: `components/Shell.tsx`
- Modify: `tests/components/Shell.test.tsx`

**Interfaces:** None consumed from other tasks. Produces nothing other tasks depend on — self-contained.

- [ ] **Step 1: Write the failing tests**

Replace the top-of-file mock and add a new `describe` block at the end of `tests/components/Shell.test.tsx`:

```tsx
// tests/components/Shell.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/merchant/dashboard',
  useRouter: () => ({ push: pushMock }),
}));

import { Shell } from '@/components/Shell';

describe('Shell', () => {
  it('highlights the nav item matching the current path', () => {
    render(
      <Shell navItems={[{ href: '/merchant/dashboard', label: 'Dashboard' }, { href: '/merchant/jobs', label: 'Quản lý tin' }]}>
        <p>content</p>
      </Shell>
    );

    expect(screen.getByText('Dashboard').closest('a')).toHaveClass('border-primary');
    expect(screen.getByText('Quản lý tin').closest('a')).not.toHaveClass('border-primary');
  });

  it('renders children inside the main content area', () => {
    render(
      <Shell navItems={[]}>
        <p>page content</p>
      </Shell>
    );
    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('renders the Merchant Job Board logo and brand text in the header', () => {
    render(
      <Shell navItems={[]}>
        <p>content</p>
      </Shell>
    );

    expect(screen.getByAltText('Merchant Job Board')).toHaveAttribute('src', '/logo-momo.png');
    expect(screen.getByText('Merchant Job Board')).toBeInTheDocument();
    expect(screen.queryByText('MoMo Việc Làm')).not.toBeInTheDocument();
  });

  it('applies the secondary text color to the main content area', () => {
    render(
      <Shell navItems={[]}>
        <p>content</p>
      </Shell>
    );

    expect(screen.getByText('content').closest('main')).toHaveClass('text-text-secondary');
  });
});

describe('Shell account menu / logout', () => {
  beforeEach(() => {
    pushMock.mockClear();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }) as any;
  });

  it('does not show the logout option until the account icon is clicked', () => {
    render(
      <Shell navItems={[]}>
        <p>content</p>
      </Shell>
    );
    expect(screen.queryByText('Đăng xuất')).not.toBeInTheDocument();
  });

  it('shows "Đăng xuất" after clicking the account icon', () => {
    render(
      <Shell navItems={[]}>
        <p>content</p>
      </Shell>
    );
    fireEvent.click(screen.getByLabelText('Tài khoản'));
    expect(screen.getByText('Đăng xuất')).toBeInTheDocument();
  });

  it('calls the logout endpoint and redirects to /login when "Đăng xuất" is clicked', async () => {
    render(
      <Shell navItems={[]}>
        <p>content</p>
      </Shell>
    );
    fireEvent.click(screen.getByLabelText('Tài khoản'));
    fireEvent.click(screen.getByText('Đăng xuất'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
      expect(pushMock).toHaveBeenCalledWith('/login');
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `npx vitest run tests/components/Shell.test.tsx`
Expected: the 4 pre-existing tests still PASS; the 3 new "account menu / logout" tests FAIL (`getByLabelText('Tài khoản')` finds no element).

- [ ] **Step 3: Implement the account icon + logout dropdown**

```tsx
// components/Shell.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

type NavItem = { href: string; label: string };

export function Shell({ navItems, children }: { navItems: NavItem[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="font-sf-rounded">
      <header className="fixed top-0 left-0 right-0 h-14 bg-primary flex items-center px-4 z-10">
        <img src="/logo-momo.png" alt="Merchant Job Board" className="w-8 h-8 rounded" />
        <span className="text-white font-semibold ml-3">Merchant Job Board</span>

        <div className="ml-auto relative">
          <button
            onClick={() => setAccountMenuOpen((open) => !open)}
            aria-label="Tài khoản"
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.5h19.6v-2.5c0-3.3-6.5-4.9-9.8-4.9z" />
            </svg>
          </button>

          {accountMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-[160px] bg-white rounded-md shadow-modal py-1 text-text-secondary">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-primary-surface"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </header>
      <aside className="fixed left-0 top-14 bottom-0 w-[220px] bg-white border-r border-border">
        <nav className="pt-4">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-5 py-3 text-sm border-l-[3px] ${
                  active
                    ? 'border-primary bg-primary-surface text-primary font-semibold'
                    : 'border-transparent text-text-secondary hover:bg-primary-surface hover:text-primary'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="ml-[220px] mt-14 p-8 bg-primary-surface min-h-[calc(100vh-56px)] text-text-secondary">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/components/Shell.test.tsx`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add components/Shell.tsx tests/components/Shell.test.tsx
git commit -m "feat: add account icon with logout to the shared header"
```

---

### Task 3: `listJobPosts` pagination (service layer)

**Files:**
- Modify: `lib/services/jobPostService.ts`
- Create: `tests/services/jobPostService-list.test.ts`

**Interfaces:**
- Consumes: `PAGE_SIZE` from `lib/constants/pagination.ts` (Task 1).
- Produces: `JobPostFilters` gains `page?: number`; `listJobPosts(merchantId: string, filters?: JobPostFilters): Promise<{ items: JobPost[]; total: number }>` (previously returned a bare array).

- [ ] **Step 1: Write the failing test**

```ts
// tests/services/jobPostService-list.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: { jobPost: { findMany: vi.fn(), count: vi.fn() } },
}));

import { listJobPosts } from '@/lib/services/jobPostService';
import { prisma } from '@/lib/db/prisma';

describe('jobPostService.listJobPosts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns page 1 (10 items) with the total count by default', async () => {
    (prisma.jobPost.findMany as any).mockResolvedValue([{ id: 'jp1' }]);
    (prisma.jobPost.count as any).mockResolvedValue(25);

    const result = await listJobPosts('m1');

    expect(prisma.jobPost.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }));
    expect(result).toEqual({ items: [{ id: 'jp1' }], total: 25 });
  });

  it('skips to the requested page', async () => {
    (prisma.jobPost.findMany as any).mockResolvedValue([]);
    (prisma.jobPost.count as any).mockResolvedValue(25);

    await listJobPosts('m1', { page: 3 });

    expect(prisma.jobPost.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, take: 10 }));
  });

  it('applies status/industry/store filters to both the list and count queries', async () => {
    (prisma.jobPost.findMany as any).mockResolvedValue([]);
    (prisma.jobPost.count as any).mockResolvedValue(0);

    await listJobPosts('m1', { status: 'live' });

    const expectedWhere = { merchantId: 'm1', deletedAt: null, status: 'live' };
    expect(prisma.jobPost.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere }));
    expect(prisma.jobPost.count).toHaveBeenCalledWith({ where: expectedWhere });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/services/jobPostService-list.test.ts`
Expected: FAIL — `prisma.jobPost.count` not called / result is an array, not `{ items, total }`.

- [ ] **Step 3: Implement pagination in `listJobPosts`**

In `lib/services/jobPostService.ts`, add the import and update the type + function:

```ts
import { PAGE_SIZE } from '@/lib/constants/pagination';
```

```ts
export type JobPostFilters = {
  status?: 'draft' | 'live' | 'paused' | 'expired';
  storeId?: string;
  industry?: string;
  page?: number;
};

export async function listJobPosts(merchantId: string, filters: JobPostFilters = {}) {
  const page = filters.page ?? 1;
  const where = {
    merchantId,
    deletedAt: null,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.industry ? { industry: filters.industry } : {}),
    ...(filters.storeId ? { jobPostStores: { some: { storeId: filters.storeId } } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.jobPost.findMany({
      where,
      include: { jobPostStores: { include: { store: true } }, applications: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.jobPost.count({ where }),
  ]);

  return { items, total };
}
```

Replace the entire old `listJobPosts` function body with this version (signature and internal `where` construction replace the prior single-query implementation).

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/services/jobPostService-list.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/services/jobPostService.ts tests/services/jobPostService-list.test.ts
git commit -m "feat: paginate listJobPosts with skip/take + count"
```

---

### Task 4: `GET /api/jobs` pagination (route layer)

**Files:**
- Modify: `app/api/jobs/route.ts`
- Modify: `tests/api/jobs-create.test.ts`

**Interfaces:**
- Consumes: `listJobPosts` returning `{ items, total }` (Task 3).

- [ ] **Step 1: Write the failing test**

Add `listJobPosts` to the existing import line and add a new test inside the `describe('GET /api/jobs', ...)` block in `tests/api/jobs-create.test.ts`:

```ts
import { POST, GET } from '@/app/api/jobs/route';
import { getSession } from '@/lib/auth/getSession';
import { createJobPost, listJobPosts, PastDeadlineError } from '@/lib/services/jobPostService';
```

```ts
describe('GET /api/jobs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when session role is not merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    const req = new Request('http://localhost/api/jobs', { method: 'GET' });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('passes the page query param and returns the { items, total } shape', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(listJobPosts).mockResolvedValue({ items: [{ id: 'jp1' }], total: 12 } as any);

    const req = new Request('http://localhost/api/jobs?page=2');
    const res = await GET(req);
    const body = await res.json();

    expect(listJobPosts).toHaveBeenCalledWith('m1', {
      status: undefined,
      storeId: undefined,
      industry: undefined,
      page: 2,
    });
    expect(body).toEqual({ items: [{ id: 'jp1' }], total: 12 });
  });

  it('defaults to page 1 when no page query param is given', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(listJobPosts).mockResolvedValue({ items: [], total: 0 } as any);

    const req = new Request('http://localhost/api/jobs');
    await GET(req);

    expect(listJobPosts).toHaveBeenCalledWith('m1', {
      status: undefined,
      storeId: undefined,
      industry: undefined,
      page: 1,
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/api/jobs-create.test.ts`
Expected: the 2 new tests FAIL (`listJobPosts` not called with a `page` key).

- [ ] **Step 3: Implement the route change**

```ts
// app/api/jobs/route.ts — replace the GET handler body
export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const result = await listJobPosts(session.merchantId!, {
    status: (searchParams.get('status') as any) ?? undefined,
    storeId: searchParams.get('storeId') ?? undefined,
    industry: searchParams.get('industry') ?? undefined,
    page: Number(searchParams.get('page') ?? '1'),
  });
  return NextResponse.json(result);
}
```

(The `POST` handler and imports are unchanged.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/api/jobs-create.test.ts`
Expected: PASS (all tests in the file)

- [ ] **Step 5: Commit**

```bash
git add app/api/jobs/route.ts tests/api/jobs-create.test.ts
git commit -m "feat: pass page query param through GET /api/jobs"
```

---

### Task 5: "Quản lý tin tuyển dụng" page pagination (UI)

**Files:**
- Modify: `app/merchant/jobs/page.tsx`
- Create: `tests/app/merchant-jobs-page.test.tsx`

**Interfaces:**
- Consumes: `Pagination` component (Task 1); `GET /api/jobs?page=` returning `{ items, total }` (Task 4).

- [ ] **Step 1: Write the failing test**

```tsx
// tests/app/merchant-jobs-page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import ManageJobPostsPage from '@/app/merchant/jobs/page';

function jobPost(id: string, title: string) {
  return { id, title, status: 'live', deadline: '2026-12-31' };
}

describe('ManageJobPostsPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [jobPost('jp1', 'Nhân viên pha chế')], total: 25 }),
    }) as any;
  });

  it('fetches page 1 on initial render and renders the items', async () => {
    render(<ManageJobPostsPage />);
    await waitFor(() => {
      expect(screen.getByText('Nhân viên pha chế')).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/jobs?page=1');
  });

  it('shows the pagination footer with the total count', async () => {
    render(<ManageJobPostsPage />);
    await waitFor(() => {
      expect(screen.getByText('Hiển thị 1 trên 25 tin')).toBeInTheDocument();
    });
  });

  it('refetches with the new page when a page button is clicked', async () => {
    render(<ManageJobPostsPage />);
    await waitFor(() => screen.getByText('Nhân viên pha chế'));

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs?page=2');
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/app/merchant-jobs-page.test.tsx`
Expected: FAIL — page renders nothing (`jobPosts.map` over `undefined`/old array assumption, no pagination footer).

- [ ] **Step 3: Implement pagination in the page component**

```tsx
// app/merchant/jobs/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Pagination } from '@/components/Pagination';

type JobPost = { id: string; title: string; status: string; deadline: string };

export default function ManageJobPostsPage() {
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`/api/jobs?page=${page}`)
      .then((res) => res.json())
      .then((body) => {
        setJobPosts(body.items);
        setTotal(body.total);
      });
  }, [page]);

  async function handleAction(id: string, action: 'pause' | 'reactivate' | 'delete') {
    await fetch(`/api/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setJobPosts((posts) => posts.filter((p) => p.id !== id || action !== 'delete'));
  }

  const STATUS_BADGE: Record<string, string> = {
    live: 'bg-status-active-bg text-status-active-text',
    paused: 'bg-status-pending-bg text-status-pending-text',
    expired: 'bg-status-off-bg text-status-off-text',
    draft: 'bg-gray-100 text-text-secondary',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Quản lý tin tuyển dụng</h1>
      <table className="w-full bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <thead>
          <tr className="bg-primary text-white text-xs uppercase">
            <th className="px-4 py-3 text-left">Tên vị trí</th>
            <th className="px-4 py-3 text-left">Trạng thái</th>
            <th className="px-4 py-3 text-left">Hạn nộp</th>
            <th className="px-4 py-3 text-left">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {jobPosts.map((post) => (
            <tr key={post.id} className="border-b border-border hover:bg-primary-surface">
              <td className="px-4 py-3 text-primary font-medium">{post.title}</td>
              <td className="px-4 py-3">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${STATUS_BADGE[post.status]}`}>
                  {post.status}
                </span>
              </td>
              <td className="px-4 py-3 text-text-secondary">{post.deadline}</td>
              <td className="px-4 py-3 flex gap-2">
                {post.status === 'live' && (
                  <button onClick={() => handleAction(post.id, 'pause')} className="text-primary text-sm hover:underline">
                    Tạm dừng
                  </button>
                )}
                {post.status === 'paused' && (
                  <button onClick={() => handleAction(post.id, 'reactivate')} className="text-primary text-sm hover:underline">
                    Kích hoạt lại
                  </button>
                )}
                <button onClick={() => handleAction(post.id, 'delete')} className="text-status-off-text text-sm hover:underline">
                  Xoá
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} pageSize={10} total={total} itemLabel="tin" onPageChange={setPage} />
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/app/merchant-jobs-page.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add app/merchant/jobs/page.tsx tests/app/merchant-jobs-page.test.tsx
git commit -m "feat: paginate the merchant job-posts list"
```

---

### Task 6: `listApplications` pagination (service layer) + CSV export stays unpaginated

**Files:**
- Modify: `lib/services/applicationService.ts`
- Create: `tests/services/applicationService-list.test.ts`

**Interfaces:**
- Consumes: `PAGE_SIZE` from `lib/constants/pagination.ts` (Task 1).
- Produces: `ApplicationFilters` gains `page?: number`; `listApplications(merchantId: string, filters?: ApplicationFilters): Promise<{ items: Application[]; total: number }>`. Pagination (`skip`/`take`) is applied **only when `filters.page` is explicitly set** — when omitted, `items` is the full unpaginated result (this is what `exportApplicationsCsv` relies on).

- [ ] **Step 1: Write the failing test**

```ts
// tests/services/applicationService-list.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: { application: { findMany: vi.fn(), count: vi.fn() } },
}));

import { listApplications, exportApplicationsCsv } from '@/lib/services/applicationService';
import { prisma } from '@/lib/db/prisma';

describe('applicationService.listApplications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('paginates (skip/take) when a page is given', async () => {
    (prisma.application.findMany as any).mockResolvedValue([{ id: 'a1' }]);
    (prisma.application.count as any).mockResolvedValue(15);

    const result = await listApplications('m1', { page: 2 });

    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    );
    expect(result).toEqual({ items: [{ id: 'a1' }], total: 15 });
  });

  it('returns the full unpaginated result when no page is given', async () => {
    (prisma.application.findMany as any).mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);
    (prisma.application.count as any).mockResolvedValue(2);

    await listApplications('m1');

    const call = (prisma.application.findMany as any).mock.calls[0][0];
    expect(call.skip).toBeUndefined();
    expect(call.take).toBeUndefined();
  });

  it('applies jobPostId/importStatus filters to both the list and count queries', async () => {
    (prisma.application.findMany as any).mockResolvedValue([]);
    (prisma.application.count as any).mockResolvedValue(0);

    await listApplications('m1', { jobPostId: 'jp1', importStatus: 'new' });

    const expectedWhere = { jobPost: { merchantId: 'm1' }, jobPostId: 'jp1', importStatus: 'new' };
    expect(prisma.application.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere }));
    expect(prisma.application.count).toHaveBeenCalledWith({ where: expectedWhere });
  });
});

describe('applicationService.exportApplicationsCsv', () => {
  beforeEach(() => vi.clearAllMocks());

  it('exports every application, not just one page', async () => {
    (prisma.application.findMany as any).mockResolvedValue([
      {
        applicantName: 'Nguyễn Văn A',
        phoneNumber: '0987654321',
        importStatus: 'new',
        appliedAt: new Date('2026-01-01T00:00:00Z'),
        jobPost: { title: 'Nhân viên pha chế' },
      },
    ]);
    (prisma.application.count as any).mockResolvedValue(1);

    const csv = await exportApplicationsCsv('m1');

    const call = (prisma.application.findMany as any).mock.calls[0][0];
    expect(call.skip).toBeUndefined();
    expect(call.take).toBeUndefined();
    expect(csv).toContain('Nguyễn Văn A,0987654321,Nhân viên pha chế,new,2026-01-01T00:00:00.000Z');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/services/applicationService-list.test.ts`
Expected: FAIL — `prisma.application.count` not called / `listApplications` returns a bare array.

- [ ] **Step 3: Implement pagination in `listApplications` and fix `exportApplicationsCsv`**

```ts
import { PAGE_SIZE } from '@/lib/constants/pagination';
```

```ts
export type ApplicationFilters = {
  jobPostId?: string;
  importStatus?: 'new' | 'imported';
  page?: number;
};

export async function listApplications(merchantId: string, filters: ApplicationFilters = {}) {
  const where = {
    jobPost: { merchantId },
    ...(filters.jobPostId ? { jobPostId: filters.jobPostId } : {}),
    ...(filters.importStatus ? { importStatus: filters.importStatus } : {}),
  };
  const paginate = filters.page != null;

  const [items, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: { jobPost: { select: { title: true } } },
      orderBy: { appliedAt: 'desc' },
      ...(paginate ? { skip: (filters.page! - 1) * PAGE_SIZE, take: PAGE_SIZE } : {}),
    }),
    prisma.application.count({ where }),
  ]);

  return { items, total };
}
```

Replace the old single-query `listApplications` with this version. Then update `exportApplicationsCsv` (which currently does `applications.map(...)` over the old bare-array return) to destructure the new shape:

```ts
export async function exportApplicationsCsv(merchantId: string, filters: ApplicationFilters = {}): Promise<string> {
  const { items } = await listApplications(merchantId, filters);
  const header = 'name,phone,job_post,import_status,applied_at';
  const rows = items.map(
    (a) => `${a.applicantName},${a.phoneNumber},${a.jobPost.title},${a.importStatus},${a.appliedAt.toISOString()}`
  );
  return [header, ...rows].join('\n');
}
```

(`exportApplicationsCsv` is called with no `filters.page`, so `paginate` is `false` and it still exports everything.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/services/applicationService-list.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Run the full test suite to check for regressions**

Run: `npx vitest run`
Expected: PASS — in particular `tests/api/applications.test.ts`'s existing `GET lists applications...` test will now FAIL because it still asserts the old bare-array shape; this is expected and fixed in Task 7.

- [ ] **Step 6: Commit**

```bash
git add lib/services/applicationService.ts tests/services/applicationService-list.test.ts
git commit -m "feat: paginate listApplications, keep exportApplicationsCsv unpaginated"
```

---

### Task 7: `GET /api/applications` pagination (route layer)

**Files:**
- Modify: `app/api/applications/route.ts`
- Modify: `tests/api/applications.test.ts`

**Interfaces:**
- Consumes: `listApplications` returning `{ items, total }` (Task 6).

- [ ] **Step 1: Write the failing test**

Replace the existing `'GET lists applications for the logged-in merchant'` test in `tests/api/applications.test.ts` (it currently asserts the pre-pagination shape) with:

```ts
it('GET lists applications for the logged-in merchant, defaulting to page 1', async () => {
  vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
  vi.mocked(applicationService.listApplications).mockResolvedValue({ items: [{ id: 'app1' }], total: 1 } as any);

  const res = await GET(new Request('http://localhost/api/applications'));
  const body = await res.json();

  expect(applicationService.listApplications).toHaveBeenCalledWith('m1', {
    jobPostId: undefined,
    importStatus: undefined,
    page: 1,
  });
  expect(res.status).toBe(200);
  expect(body).toEqual({ items: [{ id: 'app1' }], total: 1 });
});

it('GET passes a custom page query param through', async () => {
  vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
  vi.mocked(applicationService.listApplications).mockResolvedValue({ items: [], total: 0 } as any);

  await GET(new Request('http://localhost/api/applications?page=3'));

  expect(applicationService.listApplications).toHaveBeenCalledWith('m1', {
    jobPostId: undefined,
    importStatus: undefined,
    page: 3,
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/api/applications.test.ts`
Expected: FAIL — `listApplications` called without a `page` key.

- [ ] **Step 3: Implement the route change**

```ts
// app/api/applications/route.ts — replace the GET handler body
export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const result = await listApplications(session.merchantId!, {
    jobPostId: searchParams.get('jobPostId') ?? undefined,
    importStatus: (searchParams.get('importStatus') as any) ?? undefined,
    page: Number(searchParams.get('page') ?? '1'),
  });
  return NextResponse.json(result);
}
```

(`POST` handler is unchanged.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/api/applications.test.ts`
Expected: PASS (all tests in the file)

- [ ] **Step 5: Commit**

```bash
git add app/api/applications/route.ts tests/api/applications.test.ts
git commit -m "feat: pass page query param through GET /api/applications"
```

---

### Task 8: "Ứng viên" page pagination (UI)

**Files:**
- Modify: `app/merchant/applicants/page.tsx`
- Create: `tests/app/merchant-applicants-page.test.tsx`

**Interfaces:**
- Consumes: `Pagination` component (Task 1); `GET /api/applications?page=` returning `{ items, total }` (Task 7).

- [ ] **Step 1: Write the failing test**

```tsx
// tests/app/merchant-applicants-page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import ApplicantsPage from '@/app/merchant/applicants/page';

function application(id: string, name: string) {
  return { id, applicantName: name, importStatus: 'new' as const, jobPost: { title: 'Nhân viên pha chế' } };
}

describe('ApplicantsPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [application('app1', 'Nguyễn Văn A')], total: 18 }),
    }) as any;
  });

  it('fetches page 1 on initial render and renders the items', async () => {
    render(<ApplicantsPage />);
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/applications?page=1');
  });

  it('shows the pagination footer with the total count', async () => {
    render(<ApplicantsPage />);
    await waitFor(() => {
      expect(screen.getByText('Hiển thị 1 trên 18 ứng viên')).toBeInTheDocument();
    });
  });

  it('refetches with the new page when a page button is clicked', async () => {
    render(<ApplicantsPage />);
    await waitFor(() => screen.getByText('Nguyễn Văn A'));

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/applications?page=2');
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/app/merchant-applicants-page.test.tsx`
Expected: FAIL — no pagination footer, fetch called without `?page=`.

- [ ] **Step 3: Implement pagination in the page component**

```tsx
// app/merchant/applicants/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Pagination } from '@/components/Pagination';

type Application = {
  id: string;
  applicantName: string;
  importStatus: 'new' | 'imported';
  jobPost: { title: string };
};

export default function ApplicantsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/applications?page=${page}`)
      .then((res) => res.json())
      .then((body) => {
        setApplications(body.items);
        setTotal(body.total);
      });
  }, [page]);

  async function handleReveal(id: string) {
    const res = await fetch(`/api/applications/${id}/reveal-phone`, { method: 'POST' });
    const body = await res.json();
    setRevealed((r) => ({ ...r, [id]: body.phoneNumber }));
  }

  async function handleStatusChange(id: string, importStatus: 'new' | 'imported') {
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ importStatus }),
    });
    setApplications((apps) => apps.map((a) => (a.id === id ? { ...a, importStatus } : a)));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ứng viên</h1>
      <table className="w-full bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <thead>
          <tr className="bg-primary text-white text-xs uppercase">
            <th className="px-4 py-3 text-left">Tên</th>
            <th className="px-4 py-3 text-left">SĐT</th>
            <th className="px-4 py-3 text-left">Job</th>
            <th className="px-4 py-3 text-left">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} className="border-b border-border hover:bg-primary-surface">
              <td className="px-4 py-3">{app.applicantName}</td>
              <td className="px-4 py-3">
                <span className="text-text-secondary">{revealed[app.id] ?? '09x••••89'}</span>
                {!revealed[app.id] && (
                  <button onClick={() => handleReveal(app.id)} className="ml-2 text-primary text-sm hover:underline">
                    Hiện SĐT
                  </button>
                )}
              </td>
              <td className="px-4 py-3">{app.jobPost.title}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => handleStatusChange(app.id, app.importStatus === 'new' ? 'imported' : 'new')}
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${
                    app.importStatus === 'new'
                      ? 'bg-status-info-bg text-status-info-text'
                      : 'bg-status-active-bg text-status-active-text'
                  }`}
                >
                  {app.importStatus === 'new' ? 'Mới' : 'Đã nhập'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} pageSize={10} total={total} itemLabel="ứng viên" onPageChange={setPage} />
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/app/merchant-applicants-page.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add app/merchant/applicants/page.tsx tests/app/merchant-applicants-page.test.tsx
git commit -m "feat: paginate the merchant applicants list"
```

---

### Task 9: Vietnam province/district constant

**Files:**
- Create: `lib/constants/vietnamProvinces.ts`
- Test: `tests/constants/vietnamProvinces.test.ts`

**Interfaces:**
- Produces: `VIETNAM_PROVINCES: Record<string, string[]>` — 63 provinces/cities (pre-2025-merger), each mapped to its district list. Source data was supplied by the user (`vietnam-tinh-huyen.md`) and is reproduced verbatim below.

- [ ] **Step 1: Write the failing test**

```ts
// tests/constants/vietnamProvinces.test.ts
import { describe, it, expect } from 'vitest';
import { VIETNAM_PROVINCES } from '@/lib/constants/vietnamProvinces';

describe('VIETNAM_PROVINCES', () => {
  it('has exactly 63 provinces/cities', () => {
    expect(Object.keys(VIETNAM_PROVINCES)).toHaveLength(63);
  });

  it('maps Hà Nội to its districts', () => {
    expect(VIETNAM_PROVINCES['Hà Nội']).toContain('Cầu Giấy');
  });

  it('maps TP. Hồ Chí Minh to its districts', () => {
    expect(VIETNAM_PROVINCES['TP. Hồ Chí Minh']).toContain('Quận 1');
    expect(VIETNAM_PROVINCES['TP. Hồ Chí Minh']).toContain('Bình Thạnh');
  });

  it('gives every province a non-empty district list', () => {
    for (const districts of Object.values(VIETNAM_PROVINCES)) {
      expect(districts.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/constants/vietnamProvinces.test.ts`
Expected: FAIL — `Cannot find module '@/lib/constants/vietnamProvinces'`

- [ ] **Step 3: Create the constant file**

```ts
// lib/constants/vietnamProvinces.ts
// Vietnam administrative data (63 provinces, pre-2025-merger), tỉnh/thành -> quận/huyện.
// Source: user-supplied reference list (vietnam-tinh-huyen.md).
export const VIETNAM_PROVINCES: Record<string, string[]> = {
  "An Giang": ["Long Xuyên", "Châu Đốc", "An Phú", "Tân Châu", "Phú Tân", "Châu Phú", "Tịnh Biên", "Tri Tôn", "Châu Thành", "Chợ Mới", "Thoại Sơn"],
  "Bà Rịa – Vũng Tàu": ["Vũng Tàu", "Bà Rịa", "Châu Đức", "Xuyên Mộc", "Long Điền", "Đất Đỏ", "Tân Thành", "Côn Đảo"],
  "Bắc Giang": ["Bắc Giang", "Yên Thế", "Tân Yên", "Lạng Giang", "Lục Nam", "Lục Ngạn", "Sơn Động", "Yên Dũng", "Việt Yên", "Hiệp Hòa"],
  "Bắc Kạn": ["Bắc Kạn", "Pác Nặm", "Ba Bể", "Ngân Sơn", "Bạch Thông", "Chợ Đồn", "Na Rì", "Chợ Mới"],
  "Bạc Liêu": ["Bạc Liêu", "Hồng Dân", "Phước Long", "Vĩnh Lợi", "Giá Rai", "Đông Hải", "Hòa Bình"],
  "Bắc Ninh": ["Bắc Ninh", "Yên Phong", "Quế Võ", "Tiên Du", "Từ Sơn", "Thuận Thành", "Gia Bình", "Lương Tài"],
  "Bến Tre": ["Bến Tre", "Châu Thành", "Chợ Lách", "Mỏ Cày Nam", "Mỏ Cày Bắc", "Giồng Trôm", "Bình Đại", "Ba Tri", "Thạnh Phú"],
  "Bình Định": ["Quy Nhơn", "An Lão", "Hoài Ân", "Hoài Nhơn", "Phù Mỹ", "Vĩnh Thạnh", "Tây Sơn", "Phù Cát", "An Nhơn", "Tuy Phước", "Vân Canh"],
  "Bình Dương": ["Thủ Dầu Một", "Bến Cát", "Dĩ An", "Thuận An", "Tân Uyên", "Phú Giáo", "Dầu Tiếng", "Bàu Bàng"],
  "Bình Phước": ["Đồng Xoài", "Bình Long", "Phước Long", "Lộc Ninh", "Bù Đốp", "Hớn Quản", "Đồng Phú", "Bù Gia Mập", "Chơn Thành", "Phú Riềng"],
  "Bình Thuận": ["Phan Thiết", "La Gi", "Tuy Phong", "Bắc Bình", "Hàm Thuận Bắc", "Hàm Thuận Nam", "Tánh Linh", "Đức Linh", "Hàm Tân", "Phú Quý"],
  "Cà Mau": ["Cà Mau", "U Minh", "Thới Bình", "Trần Văn Thời", "Cái Nước", "Đầm Dơi", "Năm Căn", "Phú Tân", "Ngọc Hiển"],
  "Cần Thơ": ["Ninh Kiều", "Ô Môn", "Bình Thuỷ", "Cái Răng", "Thốt Nốt", "Vĩnh Thạnh", "Cờ Đỏ", "Phong Điền", "Thới Lai"],
  "Cao Bằng": ["Cao Bằng", "Bảo Lâm", "Bảo Lạc", "Hà Quảng", "Trùng Khánh", "Hạ Lang", "Quảng Uyên", "Phục Hòa", "Hòa An", "Nguyên Bình", "Thạch An"],
  "Đà Nẵng": ["Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn", "Liên Chiểu", "Cẩm Lệ", "Hoà Vang", "Hoàng Sa"],
  "Đắk Lắk": ["Buôn Ma Thuột", "Ea H'leo", "Ea Súp", "Krông Búk", "Krông Năng", "Ea Kar", "M'Đrắk", "Krông Bông", "Krông Pắc", "Krông A Na", "Lắk", "Cư Kuin", "Buôn Đôn", "Cư M'Gar"],
  "Đắk Nông": ["Gia Nghĩa", "Đắk Glong", "Cư Jút", "Đắk Mil", "Krông Nô", "Đắk Song", "Đắk R'Lấp", "Tuy Đức"],
  "Điện Biên": ["Điện Biên Phủ", "Mường Lay", "Mường Nhé", "Mường Chà", "Tủa Chùa", "Tuần Giáo", "Điện Biên", "Điện Biên Đông", "Nậm Pồ"],
  "Đồng Nai": ["Biên Hòa", "Long Khánh", "Tân Phú", "Định Quán", "Xuân Lộc", "Long Thành", "Nhơn Trạch", "Trảng Bom", "Thống Nhất", "Cẩm Mỹ", "Vĩnh Cửu"],
  "Đồng Tháp": ["Cao Lãnh", "Sa Đéc", "Hồng Ngự", "Tân Hồng", "Hồng Ngự (huyện)", "Tam Nông", "Tháp Mười", "Cao Lãnh (huyện)", "Lấp Vò", "Lai Vung", "Châu Thành"],
  "Gia Lai": ["Pleiku", "An Khê", "Ayun Pa", "KBang", "Đak Đoa", "Chư Păh", "Ia Grai", "Mang Yang", "Kông Chro", "Đức Cơ", "Chư Prông", "Chư Sê", "Đak Pơ", "Ia Pa", "Krông Pa", "Phú Thiện", "Chư Pưh"],
  "Hà Giang": ["Hà Giang", "Đồng Văn", "Mèo Vạc", "Yên Minh", "Quản Bạ", "Vị Xuyên", "Bắc Mê", "Hoàng Su Phì", "Xín Mần", "Bắc Quang", "Quang Bình"],
  "Hà Nam": ["Phủ Lý", "Duy Tiên", "Kim Bảng", "Thanh Liêm", "Bình Lục", "Lý Nhân"],
  "Hà Nội": ["Ba Đình", "Hoàn Kiếm", "Hai Bà Trưng", "Đống Đa", "Tây Hồ", "Cầu Giấy", "Thanh Xuân", "Hoàng Mai", "Long Biên", "Hà Đông", "Bắc Từ Liêm", "Nam Từ Liêm", "Sóc Sơn", "Đông Anh", "Gia Lâm", "Đan Phượng", "Hoài Đức", "Quốc Oai", "Thạch Thất", "Chương Mỹ", "Thanh Oai", "Thường Tín", "Phú Xuyên", "Ứng Hòa", "Mỹ Đức", "Mê Linh", "Ba Vì", "Phúc Thọ"],
  "Hà Tĩnh": ["Hà Tĩnh", "Hồng Lĩnh", "Hương Sơn", "Đức Thọ", "Vũ Quang", "Nghi Xuân", "Can Lộc", "Hương Khê", "Thạch Hà", "Cẩm Xuyên", "Kỳ Anh", "Lộc Hà", "Kỳ Anh (thị xã)"],
  "Hải Dương": ["Hải Dương", "Chí Linh", "Nam Sách", "Kinh Môn", "Kim Thành", "Thanh Hà", "Cẩm Giàng", "Bình Giang", "Gia Lộc", "Tứ Kỳ", "Ninh Giang", "Thanh Miện"],
  "Hải Phòng": ["Hồng Bàng", "Ngô Quyền", "Lê Chân", "Hải An", "Kiến An", "Đồ Sơn", "Dương Kinh", "Thuỷ Nguyên", "An Dương", "An Lão", "Kiến Thuỵ", "Tiên Lãng", "Vĩnh Bảo", "Cát Hải", "Bạch Long Vĩ"],
  "Hậu Giang": ["Vị Thanh", "Ngã Bảy", "Châu Thành", "Châu Thành A", "Phụng Hiệp", "Vị Thuỷ", "Long Mỹ", "Long Mỹ (thị xã)"],
  "Hoà Bình": ["Hòa Bình", "Đà Bắc", "Mai Châu", "Tân Lạc", "Lạc Sơn", "Kim Bôi", "Cao Phong", "Lương Sơn", "Lạc Thủy", "Yên Thủy"],
  "Hưng Yên": ["Hưng Yên", "Mỹ Hào", "Ân Thi", "Khoái Châu", "Kim Động", "Tiên Lữ", "Phù Cừ", "Văn Lâm", "Văn Giang", "Yên Mỹ"],
  "Khánh Hòa": ["Nha Trang", "Cam Ranh", "Vạn Ninh", "Ninh Hòa", "Diên Khánh", "Khánh Vĩnh", "Khánh Sơn", "Cam Lâm", "Trường Sa"],
  "Kiên Giang": ["Rạch Giá", "Hà Tiên", "Kiên Lương", "Hòn Đất", "Tân Hiệp", "Châu Thành", "Giồng Riềng", "Gò Quao", "An Biên", "An Minh", "Vĩnh Thuận", "Phú Quốc", "Kiên Hải", "U Minh Thượng", "Giang Thành"],
  "Kon Tum": ["Kon Tum", "Đắk Glei", "Ngọc Hồi", "Đắk Tô", "Kon Plông", "Kon Rẫy", "Đắk Hà", "Sa Thầy", "Tu Mơ Rông", "Ia H'Drai"],
  "Lai Châu": ["Lai Châu", "Tam Đường", "Mường Tè", "Sìn Hồ", "Phong Thổ", "Than Uyên", "Tân Uyên", "Nậm Nhùn"],
  "Lâm Đồng": ["Đà Lạt", "Bảo Lộc", "Đam Rông", "Lạc Dương", "Lâm Hà", "Đơn Dương", "Đức Trọng", "Di Linh", "Bảo Lâm", "Đạ Huoai", "Đạ Tẻh", "Cát Tiên"],
  "Lạng Sơn": ["Lạng Sơn", "Tràng Định", "Bình Gia", "Văn Lãng", "Cao Lộc", "Văn Quan", "Bắc Sơn", "Hữu Lũng", "Chi Lăng", "Lộc Bình", "Đình Lập"],
  "Lào Cai": ["Lào Cai", "Bát Xát", "Mường Khương", "Si Ma Cai", "Bắc Hà", "Bảo Thắng", "Bảo Yên", "Sa Pa", "Văn Bàn"],
  "Long An": ["Tân An", "Kiến Tường", "Tân Hưng", "Vĩnh Hưng", "Mộc Hóa", "Tân Thạnh", "Thạnh Hóa", "Đức Huệ", "Đức Hòa", "Bến Lức", "Thủ Thừa", "Tân Trụ", "Cần Đước", "Cần Giuộc", "Châu Thành"],
  "Nam Định": ["Nam Định", "Mỹ Lộc", "Vụ Bản", "Ý Yên", "Nghĩa Hưng", "Nam Trực", "Trực Ninh", "Xuân Trường", "Giao Thủy", "Hải Hậu"],
  "Nghệ An": ["Vinh", "Cửa Lò", "Thái Hòa", "Hoàng Mai", "Quỳ Hợp", "Quỳ Châu", "Quế Phong", "Tương Dương", "Kỳ Sơn", "Con Cuông", "Tân Kỳ", "Anh Sơn", "Đô Lương", "Thanh Chương", "Nghi Lộc", "Nam Đàn", "Hưng Nguyên", "Diễn Châu", "Yên Thành", "Quỳnh Lưu"],
  "Ninh Bình": ["Ninh Bình", "Tam Điệp", "Nho Quan", "Gia Viễn", "Hoa Lư", "Yên Mô", "Yên Khánh", "Kim Sơn"],
  "Ninh Thuận": ["Phan Rang-Tháp Chàm", "Bác Ái", "Ninh Sơn", "Ninh Hải", "Ninh Phước", "Thuận Nam", "Thuận Bắc"],
  "Phú Thọ": ["Việt Trì", "Phú Thọ", "Đoan Hùng", "Hạ Hòa", "Thanh Ba", "Cẩm Khê", "Yên Lập", "Tam Nông", "Lâm Thao", "Phù Ninh", "Thanh Sơn", "Thanh Thủy", "Tân Sơn"],
  "Phú Yên": ["Tuy Hòa", "Sông Cầu", "Đồng Xuân", "Tuy An", "Sơn Hòa", "Sông Hinh", "Tây Hòa", "Phú Hòa", "Đông Hòa"],
  "Quảng Bình": ["Đồng Hới", "Ba Đồn", "Tuyên Hóa", "Minh Hóa", "Quảng Trạch", "Bố Trạch", "Quảng Ninh", "Lệ Thủy"],
  "Quảng Nam": ["Tam Kỳ", "Hội An", "Tây Giang", "Đông Giang", "Đại Lộc", "Điện Bàn", "Duy Xuyên", "Quế Sơn", "Nam Giang", "Phước Sơn", "Hiệp Đức", "Thăng Bình", "Tiên Phước", "Bắc Trà My", "Nam Trà My", "Núi Thành", "Phú Ninh", "Nông Sơn"],
  "Quảng Ngãi": ["Quảng Ngãi", "Đức Phổ", "Ba Tơ", "Sơn Hà", "Sơn Tây", "Minh Long", "Nghĩa Hành", "Mộ Đức", "Tư Nghĩa", "Sơn Tịnh", "Bình Sơn", "Trà Bồng", "Lý Sơn", "Tây Trà"],
  "Quảng Ninh": ["Hạ Long", "Móng Cái", "Cẩm Phả", "Uông Bí", "Đông Triều", "Quảng Yên", "Hoành Bồ", "Bình Liêu", "Tiên Yên", "Đầm Hà", "Hải Hà", "Ba Chẽ", "Vân Đồn", "Cô Tô"],
  "Quảng Trị": ["Đông Hà", "Quảng Trị", "Vĩnh Linh", "Hướng Hóa", "Gio Linh", "Đakrông", "Cam Lộ", "Triệu Phong", "Hải Lăng", "Cồn Cỏ"],
  "Sóc Trăng": ["Sóc Trăng", "Châu Thành", "Kế Sách", "Mỹ Tú", "Cù Lao Dung", "Long Phú", "Mỹ Xuyên", "Ngã Năm", "Thạnh Trị", "Vĩnh Châu", "Trần Đề"],
  "Sơn La": ["Sơn La", "Quỳnh Nhai", "Thuận Châu", "Mường La", "Bắc Yên", "Phù Yên", "Mộc Châu", "Yên Châu", "Mai Sơn", "Sông Mã", "Sốp Cộp", "Vân Hồ"],
  "Tây Ninh": ["Tây Ninh", "Tân Biên", "Tân Châu", "Dương Minh Châu", "Châu Thành", "Hòa Thành", "Gò Dầu", "Bến Cầu", "Trảng Bàng"],
  "Thái Bình": ["Thái Bình", "Quỳnh Phụ", "Hưng Hà", "Đông Hưng", "Thái Thụy", "Tiền Hải", "Kiến Xương", "Vũ Thư"],
  "Thái Nguyên": ["Thái Nguyên", "Sông Công", "Phổ Yên", "Định Hóa", "Phú Lương", "Đồng Hỷ", "Võ Nhai", "Đại Từ", "Phú Bình"],
  "Thanh Hóa": ["Thanh Hóa", "Bỉm Sơn", "Sầm Sơn", "Mường Lát", "Quan Hóa", "Bá Thước", "Quan Sơn", "Lang Chánh", "Ngọc Lặc", "Cẩm Thủy", "Thạch Thành", "Hà Trung", "Vĩnh Lộc", "Yên Định", "Thọ Xuân", "Thường Xuân", "Triệu Sơn", "Thiệu Hóa", "Hoằng Hóa", "Hậu Lộc", "Nga Sơn", "Như Xuân", "Như Thanh", "Nông Cống", "Đông Sơn", "Quảng Xương", "Tĩnh Gia"],
  "Thừa Thiên Huế": ["Huế", "Phong Điền", "Quảng Điền", "Hương Trà", "Phú Vang", "Hương Thủy", "Phú Lộc", "Nam Đông", "A Lưới"],
  "Tiền Giang": ["Mỹ Tho", "Gò Công", "Cai Lậy", "Tân Phước", "Cái Bè", "Cai Lậy (huyện)", "Châu Thành", "Chợ Gạo", "Gò Công Tây", "Gò Công Đông", "Tân Phú Đông"],
  "TP. Hồ Chí Minh": ["Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", "Quận 10", "Quận 11", "Quận 12", "Bình Thạnh", "Gò Vấp", "Phú Nhuận", "Tân Bình", "Tân Phú", "Bình Tân", "Thủ Đức", "Bình Chánh", "Hóc Môn", "Củ Chi", "Nhà Bè", "Cần Giờ"],
  "Trà Vinh": ["Trà Vinh", "Càng Long", "Cầu Kè", "Tiểu Cần", "Châu Thành", "Cầu Ngang", "Trà Cú", "Duyên Hải", "Duyên Hải (thị xã)"],
  "Tuyên Quang": ["Tuyên Quang", "Lâm Bình", "Na Hang", "Chiêm Hóa", "Hàm Yên", "Yên Sơn", "Sơn Dương"],
  "Vĩnh Long": ["Vĩnh Long", "Long Hồ", "Mang Thít", "Vũng Liêm", "Tam Bình", "Bình Minh", "Trà Ôn", "Bình Tân"],
  "Vĩnh Phúc": ["Vĩnh Yên", "Phúc Yên", "Lập Thạch", "Sông Lô", "Tam Dương", "Tam Đảo", "Bình Xuyên", "Yên Lạc", "Vĩnh Tường"],
  "Yên Bái": ["Yên Bái", "Nghĩa Lộ", "Lục Yên", "Văn Yên", "Mù Cang Chải", "Trấn Yên", "Trạm Tấu", "Văn Chấn", "Yên Bình"],
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/constants/vietnamProvinces.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/constants/vietnamProvinces.ts tests/constants/vietnamProvinces.test.ts
git commit -m "feat: add Vietnam province/district reference data"
```

---

### Task 10: `listStores` search/filter/pagination (service layer)

**Files:**
- Modify: `lib/services/storeService.ts`
- Modify: `tests/services/storeService.test.ts`

**Interfaces:**
- Consumes: `PAGE_SIZE` from `lib/constants/pagination.ts` (Task 1).
- Produces: `StoreFilters` type `{ keyword?: string; city?: string; district?: string; page?: number }`; `listStores(merchantId: string, filters?: StoreFilters): Promise<{ items: Store[]; total: number }>` (previously returned a bare array with no filters).

- [ ] **Step 1: Write the failing test**

Replace the entire contents of `tests/services/storeService.test.ts`:

```ts
// tests/services/storeService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: { store: { findMany: vi.fn(), count: vi.fn() } },
}));

import { listStores } from '@/lib/services/storeService';
import { prisma } from '@/lib/db/prisma';

describe('storeService.listStores', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists page 1 (10 items) scoped to the given merchant by default', async () => {
    (prisma.store.findMany as any).mockResolvedValue([{ id: 's1', name: 'Trụ Sở Chính' }]);
    (prisma.store.count as any).mockResolvedValue(1);

    const result = await listStores('m1');

    expect(prisma.store.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { merchantId: 'm1' }, skip: 0, take: 10 })
    );
    expect(result).toEqual({ items: [{ id: 's1', name: 'Trụ Sở Chính' }], total: 1 });
  });

  it('skips to the requested page', async () => {
    (prisma.store.findMany as any).mockResolvedValue([]);
    (prisma.store.count as any).mockResolvedValue(0);

    await listStores('m1', { page: 2 });

    expect(prisma.store.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }));
  });

  it('matches keyword against name or street address, case-insensitively', async () => {
    (prisma.store.findMany as any).mockResolvedValue([]);
    (prisma.store.count as any).mockResolvedValue(0);

    await listStores('m1', { keyword: 'quan 1' });

    const expectedWhere = {
      merchantId: 'm1',
      OR: [
        { name: { contains: 'quan 1', mode: 'insensitive' } },
        { streetAddress: { contains: 'quan 1', mode: 'insensitive' } },
      ],
    };
    expect(prisma.store.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere }));
    expect(prisma.store.count).toHaveBeenCalledWith({ where: expectedWhere });
  });

  it('filters by city and district', async () => {
    (prisma.store.findMany as any).mockResolvedValue([]);
    (prisma.store.count as any).mockResolvedValue(0);

    await listStores('m1', { city: 'Hà Nội', district: 'Cầu Giấy' });

    const expectedWhere = { merchantId: 'm1', city: 'Hà Nội', district: 'Cầu Giấy' };
    expect(prisma.store.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere }));
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/services/storeService.test.ts`
Expected: FAIL — `prisma.store.count` not called / `listStores` ignores `keyword`/`city`/`district`/`page`.

- [ ] **Step 3: Implement search/filter/pagination in `listStores`**

```ts
// lib/services/storeService.ts
import { prisma } from '@/lib/db/prisma';
import { PAGE_SIZE } from '@/lib/constants/pagination';

export type StoreFilters = {
  keyword?: string;
  city?: string;
  district?: string;
  page?: number;
};

export async function listStores(merchantId: string, filters: StoreFilters = {}) {
  const page = filters.page ?? 1;
  const where = {
    merchantId,
    ...(filters.keyword
      ? {
          OR: [
            { name: { contains: filters.keyword, mode: 'insensitive' as const } },
            { streetAddress: { contains: filters.keyword, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(filters.city ? { city: filters.city } : {}),
    ...(filters.district ? { district: filters.district } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.store.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.store.count({ where }),
  ]);

  return { items, total };
}
```

This replaces the entire previous file content (the old `listStores` had no filters and no import of `PAGE_SIZE`).

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/services/storeService.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/services/storeService.ts tests/services/storeService.test.ts
git commit -m "feat: add keyword/city/district search and pagination to listStores"
```

---

### Task 11: `GET /api/merchant/stores` search/filter/pagination (route layer)

**Files:**
- Modify: `app/api/merchant/stores/route.ts`
- Modify: `tests/api/merchant-stores.test.ts`

**Interfaces:**
- Consumes: `listStores` returning `{ items, total }` (Task 10).

- [ ] **Step 1: Write the failing test**

Replace the entire contents of `tests/api/merchant-stores.test.ts`:

```ts
// tests/api/merchant-stores.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/getSession');
vi.mock('@/lib/services/storeService');

import { GET } from '@/app/api/merchant/stores/route';
import { getSession } from '@/lib/auth/getSession';
import { listStores } from '@/lib/services/storeService';

describe('GET /api/merchant/stores', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the { items, total } result for the logged-in merchant, defaulting to page 1', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(listStores).mockResolvedValue({ items: [{ id: 's1' }], total: 1 } as any);

    const res = await GET(new Request('http://localhost/api/merchant/stores'));
    const body = await res.json();

    expect(listStores).toHaveBeenCalledWith('m1', { keyword: undefined, city: undefined, district: undefined, page: 1 });
    expect(body).toEqual({ items: [{ id: 's1' }], total: 1 });
  });

  it('passes keyword/city/district/page query params through', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    vi.mocked(listStores).mockResolvedValue({ items: [], total: 0 } as any);

    const req = new Request(
      'http://localhost/api/merchant/stores?keyword=Quan1&city=H%C3%A0%20N%E1%BB%99i&district=C%E1%BA%A7u%20Gi%E1%BA%A5y&page=2'
    );
    await GET(req);

    expect(listStores).toHaveBeenCalledWith('m1', { keyword: 'Quan1', city: 'Hà Nội', district: 'Cầu Giấy', page: 2 });
  });

  it('returns 401 when there is no merchant session', async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const res = await GET(new Request('http://localhost/api/merchant/stores'));
    expect(res.status).toBe(401);
  });

  it('returns 401 when session role is not merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });

    const res = await GET(new Request('http://localhost/api/merchant/stores'));
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/api/merchant-stores.test.ts`
Expected: FAIL — current `GET()` takes no argument and calls `listStores(merchantId)` with no filters object.

- [ ] **Step 3: Implement the route change**

```ts
// app/api/merchant/stores/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { listStores } from '@/lib/services/storeService';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const result = await listStores(session.merchantId!, {
    keyword: searchParams.get('keyword') ?? undefined,
    city: searchParams.get('city') ?? undefined,
    district: searchParams.get('district') ?? undefined,
    page: Number(searchParams.get('page') ?? '1'),
  });
  return NextResponse.json(result);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/api/merchant-stores.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/merchant/stores/route.ts tests/api/merchant-stores.test.ts
git commit -m "feat: pass keyword/city/district/page query params through GET /api/merchant/stores"
```

---

### Task 12: `useStoreSearch` hook

**Files:**
- Create: `lib/hooks/useStoreSearch.ts`
- Test: `tests/hooks/useStoreSearch.test.ts`

**Interfaces:**
- Consumes: `GET /api/merchant/stores` returning `{ items, total }` (Task 11).
- Produces: `useStoreSearch(): { keyword: string; setKeyword: (v: string) => void; city: string; setCity: (v: string) => void; district: string; setDistrict: (v: string) => void; items: Store[]; total: number; hasMore: boolean; loadMore: () => void }`. Changing `keyword`/`city`/`district` resets to page 1 and replaces `items`; `loadMore()` fetches the next page and appends. `setCity` also clears `district`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/hooks/useStoreSearch.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStoreSearch } from '@/lib/hooks/useStoreSearch';

function mockFetchOnce(body: any) {
  (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => body });
}

describe('useStoreSearch', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('fetches page 1 with no filters on mount', async () => {
    mockFetchOnce({ items: [{ id: 's1', name: 'Trụ Sở Chính' }], total: 15 });

    const { result } = renderHook(() => useStoreSearch());

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(global.fetch).toHaveBeenCalledWith('/api/merchant/stores?page=1');
    expect(result.current.total).toBe(15);
    expect(result.current.hasMore).toBe(true);
  });

  it('appends the next page on loadMore without dropping existing items', async () => {
    mockFetchOnce({ items: [{ id: 's1', name: 'Store 1' }], total: 2 });
    const { result } = renderHook(() => useStoreSearch());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    mockFetchOnce({ items: [{ id: 's2', name: 'Store 2' }], total: 2 });
    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(global.fetch).toHaveBeenLastCalledWith('/api/merchant/stores?page=2');
    expect(result.current.hasMore).toBe(false);
  });

  it('resets to page 1 and replaces items when the keyword changes', async () => {
    mockFetchOnce({ items: [{ id: 's1', name: 'Store 1' }], total: 1 });
    const { result } = renderHook(() => useStoreSearch());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    mockFetchOnce({ items: [{ id: 's2', name: 'Matched Store' }], total: 1 });
    act(() => result.current.setKeyword('Matched'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith('/api/merchant/stores?keyword=Matched&page=1');
    });
    expect(result.current.items).toEqual([{ id: 's2', name: 'Matched Store' }]);
  });

  it('clears the district when the city changes', async () => {
    mockFetchOnce({ items: [], total: 0 });
    const { result } = renderHook(() => useStoreSearch());
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    mockFetchOnce({ items: [], total: 0 });
    act(() => result.current.setDistrict('Cầu Giấy'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    mockFetchOnce({ items: [], total: 0 });
    act(() => result.current.setCity('Hà Nội'));

    await waitFor(() => {
      expect(result.current.district).toBe('');
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/hooks/useStoreSearch.test.ts`
Expected: FAIL — `Cannot find module '@/lib/hooks/useStoreSearch'`

- [ ] **Step 3: Implement the hook**

```ts
// lib/hooks/useStoreSearch.ts
import { useEffect, useState } from 'react';

export type Store = {
  id: string;
  name: string;
  streetAddress: string;
  ward: string;
  district: string;
  city: string;
};

export function useStoreSearch() {
  const [keyword, setKeyword] = useState('');
  const [city, setCityState] = useState('');
  const [district, setDistrict] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Store[]>([]);
  const [total, setTotal] = useState(0);

  function setCity(next: string) {
    setCityState(next);
    setDistrict('');
  }

  function fetchPage(targetPage: number, replace: boolean) {
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (city) params.set('city', city);
    if (district) params.set('district', district);
    params.set('page', String(targetPage));

    fetch(`/api/merchant/stores?${params.toString()}`)
      .then((res) => res.json())
      .then((body) => {
        setItems((prev) => (replace ? body.items : [...prev, ...body.items]));
        setTotal(body.total);
      });
  }

  useEffect(() => {
    setPage(1);
    setItems([]);
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, city, district]);

  function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage, false);
  }

  return {
    keyword,
    setKeyword,
    city,
    setCity,
    district,
    setDistrict,
    items,
    total,
    hasMore: items.length < total,
    loadMore,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/hooks/useStoreSearch.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/hooks/useStoreSearch.ts tests/hooks/useStoreSearch.test.ts
git commit -m "feat: add useStoreSearch hook for keyword/city/district search with load-more"
```

---

### Task 13: `StoreFilterBar` component

**Files:**
- Create: `components/StoreFilterBar.tsx`
- Test: `tests/components/StoreFilterBar.test.tsx`

**Interfaces:**
- Consumes: `VIETNAM_PROVINCES` from `lib/constants/vietnamProvinces.ts` (Task 9).
- Produces: `StoreFilterBar` component with props `{ keyword: string; onKeywordChange: (v: string) => void; city: string; onCityChange: (v: string) => void; district: string; onDistrictChange: (v: string) => void }`. Debounces keyword changes by 300ms before calling `onKeywordChange`.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/StoreFilterBar.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StoreFilterBar } from '@/components/StoreFilterBar';

describe('StoreFilterBar', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('debounces keyword changes before calling onKeywordChange', () => {
    const onKeywordChange = vi.fn();
    render(
      <StoreFilterBar
        keyword=""
        onKeywordChange={onKeywordChange}
        city=""
        onCityChange={vi.fn()}
        district=""
        onDistrictChange={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('Tìm kiếm'), { target: { value: 'Quận 1' } });
    expect(onKeywordChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(onKeywordChange).toHaveBeenCalledWith('Quận 1');
  });

  it('disables the district select until a city is chosen', () => {
    render(
      <StoreFilterBar
        keyword=""
        onKeywordChange={vi.fn()}
        city=""
        onCityChange={vi.fn()}
        district=""
        onDistrictChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Quận/Huyện')).toBeDisabled();
  });

  it('calls onCityChange when a province/city is selected', () => {
    const onCityChange = vi.fn();
    render(
      <StoreFilterBar
        keyword=""
        onKeywordChange={vi.fn()}
        city=""
        onCityChange={onCityChange}
        district=""
        onDistrictChange={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('Tỉnh/Thành Phố'), { target: { value: 'Hà Nội' } });
    expect(onCityChange).toHaveBeenCalledWith('Hà Nội');
  });

  it('calls onDistrictChange when a district is selected', () => {
    const onDistrictChange = vi.fn();
    render(
      <StoreFilterBar
        keyword=""
        onKeywordChange={vi.fn()}
        city="Hà Nội"
        onCityChange={vi.fn()}
        district=""
        onDistrictChange={onDistrictChange}
      />
    );

    fireEvent.change(screen.getByLabelText('Quận/Huyện'), { target: { value: 'Cầu Giấy' } });
    expect(onDistrictChange).toHaveBeenCalledWith('Cầu Giấy');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/components/StoreFilterBar.test.tsx`
Expected: FAIL — `Cannot find module '@/components/StoreFilterBar'`

- [ ] **Step 3: Implement the component**

```tsx
// components/StoreFilterBar.tsx
'use client';

import { useEffect, useState } from 'react';
import { VIETNAM_PROVINCES } from '@/lib/constants/vietnamProvinces';

type StoreFilterBarProps = {
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  city: string;
  onCityChange: (city: string) => void;
  district: string;
  onDistrictChange: (district: string) => void;
};

export function StoreFilterBar({
  keyword,
  onKeywordChange,
  city,
  onCityChange,
  district,
  onDistrictChange,
}: StoreFilterBarProps) {
  const [keywordInput, setKeywordInput] = useState(keyword);

  useEffect(() => {
    const timer = setTimeout(() => onKeywordChange(keywordInput), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordInput]);

  return (
    <div className="flex gap-2 mb-4 items-end">
      <label className="flex flex-col gap-1 text-xs font-medium flex-1">
        Tìm kiếm
        <input
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          placeholder="Tên hoặc địa chỉ cửa hàng"
          className="border border-border rounded-md px-3 py-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium">
        Tỉnh/Thành Phố
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          className="border border-border rounded-md px-2 py-2 text-sm"
        >
          <option value="">Tất cả</option>
          {Object.keys(VIETNAM_PROVINCES).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium">
        Quận/Huyện
        <select
          value={district}
          onChange={(e) => onDistrictChange(e.target.value)}
          disabled={!city}
          className="border border-border rounded-md px-2 py-2 text-sm"
        >
          <option value="">Tất cả</option>
          {(VIETNAM_PROVINCES[city] ?? []).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/components/StoreFilterBar.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/StoreFilterBar.tsx tests/components/StoreFilterBar.test.tsx
git commit -m "feat: add StoreFilterBar (keyword + cascading city/district selects)"
```

---

### Task 14: Wire search/load-more into the job-wizard store picker (Step 1)

**Files:**
- Modify: `app/merchant/jobs/new/page.tsx`
- Modify: `tests/app/jobs-new-page.test.tsx`

**Interfaces:**
- Consumes: `useStoreSearch` (Task 12), `StoreFilterBar` (Task 13).

- [ ] **Step 1: Write the failing test**

Replace the entire contents of `tests/app/jobs-new-page.test.tsx`:

```tsx
// tests/app/jobs-new-page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));

import JobWizardPage from '@/app/merchant/jobs/new/page';

describe('JobWizardPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    global.fetch = vi.fn((url: string) => {
      if (url.startsWith('/api/merchant/stores')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [{ id: 's1', name: 'Trụ Sở Chính' }], total: 1 }),
        });
      }
      if (url === '/api/jobs') {
        return Promise.resolve({ ok: true, json: async () => ({ id: 'jp1' }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }) as any;
  });

  it('loads stores into Step 1', async () => {
    render(<JobWizardPage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Trụ Sở Chính')).toBeInTheDocument();
    });
  });

  it('does not allow submitting Step 1 with no store selected', async () => {
    render(<JobWizardPage />);
    await waitFor(() => screen.getByLabelText('Trụ Sở Chính'));
    fireEvent.click(screen.getByText('Tiếp theo'));
    expect(screen.getByText('Vui lòng chọn ít nhất 1 cửa hàng')).toBeInTheDocument();
  });

  it('shows the store search/filter bar', async () => {
    render(<JobWizardPage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Tìm kiếm')).toBeInTheDocument();
      expect(screen.getByLabelText('Tỉnh/Thành Phố')).toBeInTheDocument();
    });
  });

  it('shows a "Xem thêm" button when there are more stores than the first page', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.startsWith('/api/merchant/stores')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [{ id: 's1', name: 'Trụ Sở Chính' }], total: 11 }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<JobWizardPage />);
    await waitFor(() => {
      expect(screen.getByText('Xem thêm')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/app/jobs-new-page.test.tsx`
Expected: FAIL — page still fetches `/api/merchant/stores` directly with `.then(setStores)` over a bare array; no filter bar, no "Xem thêm" button.

- [ ] **Step 3: Implement the wizard change**

```tsx
// app/merchant/jobs/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStoreSearch } from '@/lib/hooks/useStoreSearch';
import { StoreFilterBar } from '@/components/StoreFilterBar';

type WizardState = {
  storeIds: string[];
  title: string;
  industry: string;
  employmentType: 'part_time' | 'shift' | 'seasonal';
  salaryType: 'hourly' | 'shift' | 'monthly' | 'negotiable';
  deadline: string;
  description: string;
};

const EMPLOYMENT_TYPES = [
  { value: 'part_time', label: 'Bán thời gian' },
  { value: 'shift', label: 'Theo ca' },
  { value: 'seasonal', label: 'Thời vụ' },
] as const;

export default function JobWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const storeSearch = useStoreSearch();
  const [stepError, setStepError] = useState<string | null>(null);
  const [state, setState] = useState<WizardState>({
    storeIds: [],
    title: '',
    industry: 'F&B',
    employmentType: 'part_time',
    salaryType: 'hourly',
    deadline: '',
    description: '',
  });

  function toggleStore(id: string) {
    setState((s) => ({
      ...s,
      storeIds: s.storeIds.includes(id) ? s.storeIds.filter((x) => x !== id) : [...s.storeIds, id],
    }));
  }

  function goToStep2() {
    if (state.storeIds.length === 0) {
      setStepError('Vui lòng chọn ít nhất 1 cửa hàng');
      return;
    }
    setStepError(null);
    setStep(2);
  }

  async function generateDescription() {
    const res = await fetch('/api/ai/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: state.title, industry: state.industry, employmentType: state.employmentType }),
    });
    const body = await res.json();
    setState((s) => ({ ...s, description: `${body.roleOverview}\n\n${body.requirements}\n\n${body.benefits}` }));
    setStep(3);
  }

  async function publish() {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeIds: state.storeIds,
        title: state.title,
        industry: state.industry,
        employmentType: state.employmentType,
        salaryType: state.salaryType,
        schedule: { days: ['mon'], start: '08:00', end: '17:00' },
        deadline: state.deadline,
        description: state.description,
        status: 'live',
      }),
    });
    if (res.ok) router.push('/merchant/jobs');
  }

  const steps = [
    { n: 1, label: 'Chọn cửa hàng' },
    { n: 2, label: 'Thông tin công việc' },
    { n: 3, label: 'Mô tả AI' },
    { n: 4, label: 'Đăng tin' },
  ];

  const stepper = (
    <div className="flex items-center gap-4 mb-6">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              s.n < step
                ? 'bg-primary text-white'
                : s.n === step
                ? 'bg-primary text-white'
                : 'bg-white border-2 border-border text-text-secondary'
            }`}
          >
            {s.n < step ? '✓' : s.n}
          </div>
          <span className={`text-xs ${s.n === step ? 'text-primary font-semibold' : 'text-text-secondary'}`}>
            {s.label}
          </span>
          {i < steps.length - 1 && <div className={`w-8 h-0.5 ${s.n < step ? 'bg-primary' : 'bg-border'}`} />}
        </div>
      ))}
    </div>
  );

  const primaryButton = 'bg-primary text-white rounded-md px-5 py-2.5 font-semibold hover:bg-primary-hover';
  const inputClass =
    'border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 w-full';
  const card = 'bg-white border border-border rounded-lg shadow-card p-8';

  if (step === 1) {
    return (
      <div>
        {stepper}
        <div className={card}>
          <h1 className="text-lg font-bold mb-4">Chọn địa điểm làm việc</h1>
          <StoreFilterBar
            keyword={storeSearch.keyword}
            onKeywordChange={storeSearch.setKeyword}
            city={storeSearch.city}
            onCityChange={storeSearch.setCity}
            district={storeSearch.district}
            onDistrictChange={storeSearch.setDistrict}
          />
          <div className="flex flex-col gap-2 mb-4">
            {storeSearch.items.map((store) => (
              <label
                key={store.id}
                htmlFor={store.id}
                className="flex items-center gap-2 border border-border rounded-md px-4 py-3 cursor-pointer hover:border-primary"
              >
                <input
                  id={store.id}
                  type="checkbox"
                  checked={state.storeIds.includes(store.id)}
                  onChange={() => toggleStore(store.id)}
                />
                {store.name}
              </label>
            ))}
          </div>
          {storeSearch.hasMore && (
            <button onClick={storeSearch.loadMore} className="text-primary text-sm hover:underline mb-4">
              Xem thêm
            </button>
          )}
          {stepError && <p className="text-status-off-text text-sm mb-4">{stepError}</p>}
          <button onClick={goToStep2} className={primaryButton}>
            Tiếp theo
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div>
        {stepper}
        <div className={`${card} flex flex-col gap-4`}>
          <h1 className="text-lg font-bold">Thông tin công việc</h1>

          <div className="flex flex-col gap-1">
            <label htmlFor="title" className="text-xs font-semibold uppercase tracking-wide">
              Tên vị trí tuyển dụng
            </label>
            <input
              id="title"
              value={state.title}
              onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
              className={inputClass}
            />
          </div>

          <fieldset className="flex gap-2">
            <legend className="text-xs font-semibold uppercase tracking-wide mb-1">Loại hình làm việc</legend>
            {EMPLOYMENT_TYPES.map((t) => (
              <label
                key={t.value}
                htmlFor={t.value}
                className={`px-4 py-2 rounded-pill border text-sm cursor-pointer ${
                  state.employmentType === t.value
                    ? 'bg-primary-surface border-primary text-primary font-semibold'
                    : 'border-border text-text-secondary'
                }`}
              >
                <input
                  id={t.value}
                  type="radio"
                  name="employmentType"
                  className="sr-only"
                  checked={state.employmentType === t.value}
                  onChange={() => setState((s) => ({ ...s, employmentType: t.value }))}
                />
                {t.label}
              </label>
            ))}
          </fieldset>

          <div className="flex flex-col gap-1">
            <label htmlFor="deadline" className="text-xs font-semibold uppercase tracking-wide">
              Hạn nộp hồ sơ
            </label>
            <input
              id="deadline"
              type="date"
              value={state.deadline}
              onChange={(e) => setState((s) => ({ ...s, deadline: e.target.value }))}
              className={inputClass}
            />
          </div>

          <button onClick={generateDescription} className={`${primaryButton} self-start`}>
            Tiếp theo
          </button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div>
        {stepper}
        <div className={`${card} flex flex-col gap-4`}>
          <h1 className="text-lg font-bold">Mô tả công việc (AI đề xuất)</h1>
          <textarea
            value={state.description}
            onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
            className={`${inputClass} min-h-[200px]`}
          />
          <button onClick={() => setStep(4)} className={`${primaryButton} self-start`}>
            Tiếp theo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {stepper}
      <div className={`${card} flex flex-col gap-4`}>
        <h1 className="text-lg font-bold">Xem lại & Đăng tin</h1>
        <p className="font-semibold">{state.title}</p>
        <p className="text-sm text-text-secondary whitespace-pre-line">{state.description}</p>
        <button onClick={publish} className={`${primaryButton} self-start`}>
          Đăng tin
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/app/jobs-new-page.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add app/merchant/jobs/new/page.tsx tests/app/jobs-new-page.test.tsx
git commit -m "feat: search/filter/load-more store picker in the job wizard"
```

---

### Task 15: Wire search/load-more into the profile page store list

**Files:**
- Modify: `lib/services/merchantProfileService.ts`
- Modify: `tests/services/merchantProfileService.test.ts`
- Modify: `app/merchant/profile/page.tsx`
- Create: `tests/app/merchant-profile-page.test.tsx`

**Interfaces:**
- Consumes: `useStoreSearch` (Task 12), `StoreFilterBar` (Task 13).

- [ ] **Step 1: Write the failing tests**

Update the first test in `tests/services/merchantProfileService.test.ts` (remove the `include: { stores: true }` expectation, since the profile page now sources stores from `/api/merchant/stores` instead):

```ts
it('fetches a merchant profile', async () => {
  (prisma.merchant.findUnique as any).mockResolvedValue({ id: 'm1', brandName: 'Jollibee' });

  const profile = await getMerchantProfile('m1');

  expect(prisma.merchant.findUnique).toHaveBeenCalledWith({ where: { id: 'm1' } });
  expect(profile).toEqual({ id: 'm1', brandName: 'Jollibee' });
});
```

Create `tests/app/merchant-profile-page.test.tsx`:

```tsx
// tests/app/merchant-profile-page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import MerchantProfilePage from '@/app/merchant/profile/page';

describe('MerchantProfilePage', () => {
  beforeEach(() => {
    global.fetch = vi.fn((url: string) => {
      if (url === '/api/merchant/profile') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ brandName: 'Jollibee Việt Nam', description: 'Mô tả', hotline: '1900' }),
        });
      }
      if (url.startsWith('/api/merchant/stores')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [{ id: 's1', name: 'Cửa hàng Quận 1' }], total: 1 }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }) as any;
  });

  it('renders the brand name and the store list', async () => {
    render(<MerchantProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('Jollibee Việt Nam')).toBeInTheDocument();
      expect(screen.getByText('Cửa hàng Quận 1')).toBeInTheDocument();
    });
  });

  it('shows the store search/filter bar', async () => {
    render(<MerchantProfilePage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Tìm kiếm')).toBeInTheDocument();
      expect(screen.getByLabelText('Tỉnh/Thành Phố')).toBeInTheDocument();
      expect(screen.getByLabelText('Quận/Huyện')).toBeInTheDocument();
    });
  });

  it('shows a "Xem thêm" button when there are more stores than the first page', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/merchant/profile') {
        return Promise.resolve({ ok: true, json: async () => ({ brandName: 'Jollibee', description: '', hotline: '' }) });
      }
      if (url.startsWith('/api/merchant/stores')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [{ id: 's1', name: 'Cửa hàng Quận 1' }], total: 11 }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<MerchantProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('Xem thêm')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/services/merchantProfileService.test.ts tests/app/merchant-profile-page.test.tsx`
Expected: FAIL — `getMerchantProfile` still passes `include: { stores: true }`; `app/merchant/profile/page.tsx` doesn't exist yet in its new form (no filter bar, no "Xem thêm").

- [ ] **Step 3: Drop the `stores` include from `getMerchantProfile`**

```ts
// lib/services/merchantProfileService.ts
export async function getMerchantProfile(merchantId: string) {
  return prisma.merchant.findUnique({ where: { id: merchantId } });
}
```

(`updateMerchantProfile` and its Zod schema are unchanged.)

- [ ] **Step 4: Implement the profile page change**

```tsx
// app/merchant/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useStoreSearch } from '@/lib/hooks/useStoreSearch';
import { StoreFilterBar } from '@/components/StoreFilterBar';

type Profile = {
  brandName: string;
  description: string | null;
  hotline: string | null;
};

export default function MerchantProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const storeSearch = useStoreSearch();

  useEffect(() => {
    fetch('/api/merchant/profile')
      .then((res) => res.json())
      .then(setProfile);
  }, []);

  async function handleSave() {
    if (!profile) return;
    await fetch('/api/merchant/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: profile.description, hotline: profile.hotline }),
    });
  }

  if (!profile) return null;

  return (
    <div className="flex flex-col gap-4">
      <p className="bg-status-info-bg text-status-info-text text-sm rounded-md px-4 py-2 inline-block">
        Đồng bộ từ MoMo Business Page
      </p>
      <h1 className="text-2xl font-bold">{profile.brandName}</h1>
      <div className="bg-white border border-border rounded-lg shadow-card p-8 flex flex-col gap-4">
        <textarea
          value={profile.description ?? ''}
          onChange={(e) => setProfile({ ...profile, description: e.target.value })}
          className="border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
        />
        <input
          value={profile.hotline ?? ''}
          onChange={(e) => setProfile({ ...profile, hotline: e.target.value })}
          className="border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
        />
        <button
          onClick={handleSave}
          className="bg-primary text-white rounded-md px-5 py-2.5 font-semibold hover:bg-primary-hover self-start"
        >
          Chỉnh sửa
        </button>
      </div>
      <h2 className="text-lg font-bold">Danh sách cửa hàng ({storeSearch.total})</h2>
      <StoreFilterBar
        keyword={storeSearch.keyword}
        onKeywordChange={storeSearch.setKeyword}
        city={storeSearch.city}
        onCityChange={storeSearch.setCity}
        district={storeSearch.district}
        onDistrictChange={storeSearch.setDistrict}
      />
      <ul className="bg-white border border-border rounded-lg shadow-card divide-y divide-border">
        {storeSearch.items.map((s) => (
          <li key={s.id} className="px-4 py-3">
            {s.name}
          </li>
        ))}
      </ul>
      {storeSearch.hasMore && (
        <button onClick={storeSearch.loadMore} className="text-primary text-sm hover:underline self-start">
          Xem thêm
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/services/merchantProfileService.test.ts tests/app/merchant-profile-page.test.tsx`
Expected: PASS (all tests)

- [ ] **Step 6: Run the full test suite**

Run: `npx vitest run`
Expected: PASS — every test in the project, no regressions.

- [ ] **Step 7: Commit**

```bash
git add lib/services/merchantProfileService.ts tests/services/merchantProfileService.test.ts app/merchant/profile/page.tsx tests/app/merchant-profile-page.test.tsx
git commit -m "feat: search/filter/load-more store list on the merchant profile page"
```
