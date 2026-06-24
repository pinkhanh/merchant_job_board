# Login/Header Branding + Default Text Color Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder logo/brand text in the merchant/admin header with the real MoMo logo and "Merchant Job Board" text, and make `#6B6B6B` the default text color across the merchant/admin app and login page (excluding header and sidebar nav).

**Architecture:** Two isolated edits, each covered by a component/page test using React Testing Library + Vitest (already the project's test stack — see `tests/components/Shell.test.tsx`, `tests/app/login-page.test.tsx`). The text-color change relies on CSS inheritance: adding `text-text-secondary` to a container (`<main>` in `Shell.tsx`, `<form>` in the login page) colors any descendant that has no explicit color class, while descendants with their own color class are unaffected.

**Tech Stack:** Next.js (App Router), React 19, Tailwind CSS v4 (`@theme` tokens in `app/globals.css`), Vitest + @testing-library/react + jsdom.

## Global Constraints

- New logo image must be served from `public/logo-momo.png` and referenced as `/logo-momo.png`.
- Brand text must read exactly "Merchant Job Board" (replacing "MoMo Việc Làm").
- Use the existing `text-text-secondary` Tailwind utility (maps to `--color-text-secondary: #6B6B6B` in `app/globals.css` — do not change the token value itself).
- Do not modify `<header>` or `<aside>` (sidebar nav) styling in `components/Shell.tsx` beyond the logo/brand text swap — they keep their current explicit colors.
- Do not touch worker-facing pages/tokens (`app/page.tsx`, `app/jobs/*`, `components/WorkerHeader.tsx`, `worker-*` theme tokens).
- Source image is at `C:\Users\jasmi\Downloads\logoMoMo.png` (Windows path) / `/c/Users/jasmi/Downloads/logoMoMo.png` (Git Bash path).

---

### Task 1: Replace header logo + brand text, color the main content area

**Files:**
- Create: `public/logo-momo.png` (binary copy of `C:\Users\jasmi\Downloads\logoMoMo.png`)
- Modify: `components/Shell.tsx`
- Test: `tests/components/Shell.test.tsx`

**Interfaces:**
- Consumes: nothing new — `Shell` keeps its existing `{ navItems, children }` props.
- Produces: nothing consumed by other tasks (Task 2 is independent).

- [ ] **Step 1: Copy the logo asset into `public/`**

```bash
cp "/c/Users/jasmi/Downloads/logoMoMo.png" "/c/Users/jasmi/merchant-job-board/public/logo-momo.png"
```

- [ ] **Step 2: Write the failing tests**

Replace the full contents of `tests/components/Shell.test.tsx` with:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({ usePathname: () => '/merchant/dashboard' }));

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
```

- [ ] **Step 3: Run the tests to verify the two new cases fail**

Run: `npx vitest run tests/components/Shell.test.tsx`
Expected: 2 tests pass (the pre-existing ones), 2 tests FAIL (logo/brand text not found; `main` missing `text-text-secondary` class).

- [ ] **Step 4: Implement the change**

In `components/Shell.tsx`, replace:

```tsx
      <header className="fixed top-0 left-0 right-0 h-14 bg-primary flex items-center px-4 z-10">
        <div className="w-8 h-8 bg-white rounded text-primary flex items-center justify-center font-bold">M</div>
        <span className="text-white font-semibold ml-3">MoMo Việc Làm</span>
      </header>
```

with:

```tsx
      <header className="fixed top-0 left-0 right-0 h-14 bg-primary flex items-center px-4 z-10">
        <img src="/logo-momo.png" alt="Merchant Job Board" className="w-8 h-8 rounded" />
        <span className="text-white font-semibold ml-3">Merchant Job Board</span>
      </header>
```

and replace:

```tsx
      <main className="ml-[220px] mt-14 p-8 bg-primary-surface min-h-[calc(100vh-56px)]">{children}</main>
```

with:

```tsx
      <main className="ml-[220px] mt-14 p-8 bg-primary-surface min-h-[calc(100vh-56px)] text-text-secondary">{children}</main>
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/components/Shell.test.tsx`
Expected: all 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add public/logo-momo.png components/Shell.tsx tests/components/Shell.test.tsx
git commit -m "feat: replace placeholder logo with MoMo logo and color main content area"
```

---

### Task 2: Color the login page's default text

**Files:**
- Modify: `app/login/page.tsx`
- Test: `tests/app/login-page.test.tsx`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Write the failing test**

Replace the full contents of `tests/app/login-page.test.tsx` with:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));

import LoginPage from '@/app/login/page';

describe('LoginPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    global.fetch = vi.fn();
  });

  it('shows an error message when login fails', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Sai tài khoản hoặc mật khẩu' }),
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Tên đăng nhập'), { target: { value: 'wrong' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Sai tài khoản hoặc mật khẩu');
    });
  });

  it('redirects to /merchant/dashboard on successful merchant login', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, role: 'merchant' }),
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Tên đăng nhập'), { target: { value: 'merchant1' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'correct' } });
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/merchant/dashboard');
    });
  });

  it('redirects to /admin/merchants on successful admin login', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, role: 'admin' }),
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Tên đăng nhập'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'ChangeMe123!' } });
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/admin/merchants');
    });
  });

  it('applies the secondary text color to the form so default text inherits it', () => {
    render(<LoginPage />);
    expect(screen.getByText('Đăng nhập', { selector: 'h1' }).closest('form')).toHaveClass('text-text-secondary');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/app/login-page.test.tsx`
Expected: first 3 tests pass, last test FAILS (`form` missing `text-text-secondary` class).

- [ ] **Step 3: Implement the change**

In `app/login/page.tsx`, replace:

```tsx
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-modal p-8 w-[400px] flex flex-col gap-4"
      >
```

with:

```tsx
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-modal p-8 w-[400px] flex flex-col gap-4 text-text-secondary"
      >
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/app/login-page.test.tsx`
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/login/page.tsx tests/app/login-page.test.tsx
git commit -m "feat: color login form text with the secondary text color"
```

---

### Task 3: Full regression check + manual visual verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: all tests PASS (no regressions in other suites).

- [ ] **Step 2: Start the dev server**

Run: `npm run dev` (in background / separate terminal)
Expected: server starts on `http://localhost:3000`.

- [ ] **Step 3: Visually verify the login page**

Open `http://localhost:3000/login` in a browser.
Expected: "Đăng nhập" heading, "Tên đăng nhập" and "Mật khẩu" labels render in `#6B6B6B` gray; the submit button text stays white-on-primary; an error message (after a failed login attempt) still renders in red (`text-status-off-text`).

- [ ] **Step 4: Visually verify an admin page**

Log in as admin, open `http://localhost:3000/admin/merchants`.
Expected: header shows the MoMo logo image + "Merchant Job Board" text on the primary-colored background; sidebar nav text unchanged; table headers (white-on-primary) unchanged; plain table cell text and the page `<h1>` render in `#6B6B6B`; status badges and primary-colored links keep their own colors.

- [ ] **Step 5: Visually verify a merchant page**

Open `http://localhost:3000/merchant/dashboard`.
Expected: same header changes as admin; dashboard stat labels and other default text in `#6B6B6B`; stat numbers and the "Đăng tin mới" button keep their own colors.

- [ ] **Step 6: Stop the dev server**

Stop the background `npm run dev` process once verification is complete.
