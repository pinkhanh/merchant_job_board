# Merchant site: logout, list pagination, store search/filter

## Context

This spec covers 3 of 4 features requested for the merchant site. The 4th (one account managing multiple merchants) requires a `User`↔`Merchant` schema change (currently 1-to-1 via `User.merchantId`) and a merchant-selection flow, and is deferred to a separate spec.

Current state:
- `components/Shell.tsx` is the shared header/sidebar layout for **both** `/merchant/*` and `/admin/*` — it has no logout affordance. The logout API (`POST /api/auth/logout`, clears the session cookie) already exists and is unused by any UI.
- `lib/services/jobPostService.ts#listJobPosts` and `lib/services/applicationService.ts#listApplications` return the full unpaginated result set; `app/merchant/jobs/page.tsx` and `app/merchant/applicants/page.tsx` render every row with no pagination controls.
- `lib/services/storeService.ts#listStores` is a plain `findMany` with no search/filter/pagination. It backs `GET /api/merchant/stores`, consumed by the store-picker step of `app/merchant/jobs/new/page.tsx` (job creation wizard) and the store list section of `app/merchant/profile/page.tsx` (the latter currently gets stores via `getMerchantProfile`'s `include: { stores: true }` instead, not the stores endpoint).
- `components/WorkerHeader.tsx` has a small hardcoded 3-city province/district map (`CITIES`) for the public worker-facing location filter — a UI pattern to follow, but not a data source to reuse (too small, worker-scoped).

## Goals

1. Add a logout affordance to the shared header.
2. Add page-based pagination (10 items/page) to the merchant "Quản lý tin tuyển dụng" (job posts) and "Ứng viên" (applicants) list screens.
3. Add keyword search + Tỉnh/Thành + Quận/Huyện filtering, plus load-more pagination (10 items per load), to the store list used in the job-creation wizard and the merchant profile page.

## Changes

### 1. Logout (`components/Shell.tsx`)

- Add a default-placeholder avatar icon to the header, right-aligned. No avatar image asset exists in the project, so this is a generic inline SVG "person" icon (not a new image file).
- Clicking it toggles a small dropdown with a single action, "Đăng xuất".
- Clicking "Đăng xuất" calls `POST /api/auth/logout` (existing route, no changes needed), then redirects to `/login`.
- Since `Shell` is shared, this appears on both merchant and admin headers — no per-layout work needed.
- No backend changes.

### 2. Pagination — job posts & applicants lists

**Backend:**
- `listJobPosts(merchantId, filters)` (`lib/services/jobPostService.ts`) and `listApplications(merchantId, filters)` (`lib/services/applicationService.ts`) each gain a `page` filter (1-indexed, default 1). Page size is a fixed internal constant of 10 (not caller-configurable). Both use Prisma `skip`/`take` plus a separate `count` query for the total — no in-memory slicing.
- `GET /api/jobs` and `GET /api/applications` read `?page=` from the query string and return `{ items, total, page, pageSize }` instead of a bare array.

**Frontend:**
- New `components/Pagination.tsx`: props `{ page, pageSize, total, onPageChange }`. Renders "Hiển thị X trên Y tin" on the left and `‹` / page-number buttons / `›` on the right, matching the provided reference screenshot. Shows at most 5 numbered buttons, sliding to stay centered on the current page when `total` implies more pages than that.
- `app/merchant/jobs/page.tsx` and `app/merchant/applicants/page.tsx`: add `page` state, include it in the fetch query string, read `{ items, total }` from the response, render `items` (instead of the old bare array) and `<Pagination>` below the table.

### 3. Store search/filter + load-more

**Province data:**
- New `lib/constants/vietnamProvinces.ts`, exporting `VIETNAM_PROVINCES: Record<string, string[]>` — restructured from the user-supplied list of 63 provinces/cities and their districts (heading numbers stripped, each province name mapped to its district array).

**Backend:**
- `listStores(merchantId, filters)` (`lib/services/storeService.ts`) gains filters: `keyword` (case-insensitive match against `name` OR `streetAddress`), `city`, `district`, and `page` (fixed page size 10, same pattern as above). Returns `{ items, total }`.
- `GET /api/merchant/stores` reads `?keyword=&city=&district=&page=` and returns `{ items, total }`.

**Frontend:**
- New hook `useStoreSearch()` (e.g. `lib/hooks/useStoreSearch.ts`): owns `keyword`/`city`/`district`/`page` state, fetches from `/api/merchant/stores`, and accumulates `items` across load-more calls. Changing `keyword`/`city`/`district` resets to page 1 and clears the accumulated list.
- New `components/StoreFilterBar.tsx`: debounced keyword input + Tỉnh/Thành dropdown (keys of `VIETNAM_PROVINCES`) + Quận/Huyện dropdown (cascading: disabled until a province is chosen, options from `VIETNAM_PROVINCES[city]`, same disable/reset pattern as `WorkerHeader`).
- A "Xem thêm" button is rendered whenever `items.length < total`; clicking it loads the next 10.
- Two call sites share the hook + filter bar but render their own list markup:
  - `app/merchant/jobs/new/page.tsx` step 1: replace the current unfiltered checkbox list with this hook/filter bar, keeping checkboxes (selection state stays in the wizard's existing `storeIds` state).
  - `app/merchant/profile/page.tsx`: replace the "Danh sách cửa hàng" section (currently sourced from `getMerchantProfile`'s `stores` include) with the same hook/filter bar, rendered as a plain (non-selectable) list. `getMerchantProfile` (`lib/services/merchantProfileService.ts`) drops its `include: { stores: true }` since the profile page no longer needs it from that endpoint.

## Out of scope

- Multi-merchant account support (separate spec, deferred).
- Pagination/filtering for admin-side list screens (`/admin/*`) — only the merchant screens named above.
- Notification bell shown in the reference screenshots.
- Changing `WorkerHeader.tsx`'s own hardcoded city list or any worker-facing (`/`, `/jobs`) behavior.

## Testing

- Update/extend existing tests for `listJobPosts`, `listApplications`, `listStores`, and their respective API routes to cover pagination/filtering (page boundaries, total count, empty results).
- Run the dev server and manually verify:
  - Header avatar + "Đăng xuất" works from both a merchant and an admin session, redirects to `/login`, and the session cookie is cleared.
  - "Quản lý tin tuyển dụng" and "Ứng viên" show 10 rows/page with working page-number navigation and a correct "Hiển thị X trên Y" count, for merchants with >10 and <10 records.
  - Job wizard step 1 and the profile page's store list both: load 10 stores initially, "Xem thêm" appends the next 10, keyword search and city/district filters narrow results and reset to page 1.
