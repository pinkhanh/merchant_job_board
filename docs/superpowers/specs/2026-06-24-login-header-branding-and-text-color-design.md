# Branding update + default text color fix (Merchant/Admin app)

## Context

The merchant/admin app (post-login Shell layout + login page) currently:
- Shows a placeholder white "M" square + the text "MoMo Việc Làm" as the logo/brand in the shared header (`components/Shell.tsx`).
- Defines a design-system token `--color-text-secondary: #6B6B6B` in `app/globals.css`, but only applies it to a handful of elements. Most other text (page `<h1>` titles, form labels, table cell content, list items) has no explicit color class and falls back to the global `body` foreground color (`#171717`, near-black), which reads as inconsistent/hard-to-read against the intended design system.

## Goals

1. Replace the placeholder logo with the real MoMo logo image and rename the brand text next to it to "Merchant Job Board".
2. Make `#6B6B6B` (the existing `text-secondary` token) the default text color across the merchant/admin app and the login page — except inside the header bar and the sidebar nav, which keep their current explicit colors.
3. Leave all intentionally-colored text untouched (primary-colored links/titles, status badges, white text on colored buttons/header, error text).
4. Do not touch the public worker-facing pages (`/`, `/jobs`) or their separate `worker-*` design tokens — out of scope.

## Changes

### 1. Logo + brand text (`components/Shell.tsx`)

- Copy `logoMoMo.png` (provided by user, currently in `~/Downloads/logoMoMo.png`) into `public/logo-momo.png`.
- Replace the `<div className="w-8 h-8 bg-white rounded ...">M</div>` placeholder with `<img src="/logo-momo.png" alt="Merchant Job Board" className="w-8 h-8 rounded" />`.
- Change the adjacent `<span>` text from "MoMo Việc Làm" to "Merchant Job Board".
- Header bar itself (background, white text) is otherwise unchanged.

### 2. Default text color via CSS inheritance

Rather than touching every individual text element, rely on CSS color inheritance by setting the secondary color at the container level so any element that does *not* declare its own color class inherits it; elements with explicit color classes (e.g. `text-primary`, `text-white`, `text-status-*-text`) keep their own color since an element's own class always wins over inheritance.

- `components/Shell.tsx`: add `text-text-secondary` to the `<main>` element's className. This covers every admin/merchant authenticated page (dashboard, jobs, applicants, merchants, profile, job wizard) without per-page edits. `<header>` and `<aside>` are siblings of `<main>`, not descendants, so they are structurally unaffected.
- `app/login/page.tsx`: add `text-text-secondary` to the `<form>` element's className, so "Đăng nhập" (h1), "Tên đăng nhập", and "Mật khẩu" labels pick up the color. The submit button (white text on primary background) and the error message (`text-status-off-text`) keep their explicit colors.

### Out of scope / unchanged

- `--color-text-secondary` token value itself (already correct at `#6B6B6B`).
- `worker-*` tokens and worker-facing pages (`app/page.tsx`, `app/jobs/*`, `components/WorkerHeader.tsx`).
- Any status badge colors, primary-colored links/titles, button colors.

## Testing

- Run the dev server, visually check:
  - Login page: heading/labels render in `#6B6B6B`, button and error text unchanged.
  - Admin pages (`/admin/merchants`, `/admin/jobs`, `/admin/applicants`): header shows new logo + "Merchant Job Board"; body text defaults to `#6B6B6B`; status badges, primary-colored links, header/nav untouched.
  - Merchant pages (`/merchant/dashboard`, `/merchant/jobs`, `/merchant/jobs/new`, `/merchant/applicants`, `/merchant/profile`): same checks.
