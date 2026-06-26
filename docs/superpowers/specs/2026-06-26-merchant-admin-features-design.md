# Merchant Admin Features Design

**Date:** 2026-06-26  
**Scope:** Admin merchant detail page — tab layout, edit merchant info, manage accounts, worker site active-only filter

---

## Overview

Three connected features centred on the Merchant entity:

1. **Admin merchant detail page** rebuilt as a 2-tab layout (Thông tin chung / Tài khoản)
2. **Edit merchant info + toggle active/inactive** from the detail page
3. **Worker site** filters to only show jobs from `active` merchants

No Prisma migration required — all fields and enums already exist in the schema.

---

## 1. Tab Layout — `/admin/merchants/[id]`

The page is rebuilt as a client component with two tabs. Active tab is tracked via the `tab` query param (`?tab=info` default, `?tab=accounts`), making tabs bookmarkable and reload-safe.

### Header (outside tabs)

Persistent across both tabs:

- Back link: `← Quay lại` → `/admin/merchants`
- Merchant brand name (heading)
- **Toggle active/inactive button** — shows current status badge; click immediately calls `PATCH /api/admin/merchants/[id]` with `{ status }`, updates state optimistically, shows toast on success/failure. No confirmation dialog needed (reversible action).

### Tab: Thông tin chung (`?tab=info`)

Default tab. Two modes:

**Read mode** — renders existing `MerchantProfileView` component (already built, `readOnly` prop). Nút "Chỉnh sửa" góc phải switches to edit mode.

**Edit mode** — replaces the profile view inline with a form. Fields:

| Field | Input type | Validation |
|---|---|---|
| `brandName` | text | required, min 1 |
| `industry` | text | required, min 1 |
| `hotline` | text | optional |
| `description` | textarea | optional, max 500 chars |
| `logoUrl` | text (URL) | optional |
| `bannerUrl` | text (URL) | optional |
| `jobCategories` | tag input (chip-style, nhấn Enter hoặc dấu phẩy để thêm chip, click × để xoá) | optional, array of strings |

Actions: **[Huỷ]** (returns to read mode, discards changes) / **[Lưu thay đổi]** (calls PATCH, shows toast, returns to read mode on success).

### Tab: Tài khoản (`?tab=accounts`)

Bảng danh sách `User` records với `role='merchant'` và `merchantId` của merchant hiện tại.

**Columns:** Username / Trạng thái / Ngày tạo / Actions

**Actions per row:**
- **Đổi mật khẩu** — expands inline form dưới row: `newPassword` + `confirmPassword` inputs + [Lưu] / [Huỷ]. Admin không cần nhập mật khẩu cũ.
- **Khoá / Mở** — toggles `isActive`, no confirmation (reversible)
- **Xoá** — disabled + tooltip nếu chỉ còn 1 account (guard: merchant phải có ít nhất 1 account tổng cộng, kể cả inactive). Nếu có thể xoá, hiện inline confirm text "Xác nhận xoá?" + [Xoá] / [Huỷ] thay cho button.

**Thêm mới** — nút "+ Thêm mới" phía trên bảng, click hiện form inline trên đầu bảng:

- `username` (text, required, min 3, unique — validated server-side)
- `password` (password, required, min 8)
- `confirmPassword` (password, required, must match)

Actions: [Huỷ] / [Tạo tài khoản]. Sau khi tạo thành công, form ẩn lại, row mới xuất hiện đầu bảng.

---

## 2. API Changes

### `PATCH /api/admin/merchants/[id]`

Hiện chỉ nhận `{ status }`. Mở rộng để nhận cả merchant fields:

Dùng partial schema (không dùng discriminated union — đơn giản hơn, các field đều optional):

Zod schema mới trong `adminMerchantService.ts`:

```ts
export const updateMerchantSchema = z.object({
  brandName: z.string().min(1).optional(),
  industry: z.string().min(1).optional(),
  hotline: z.string().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
  jobCategories: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});
```

Service function `updateMerchant(id, data)` added alongside existing `setMerchantStatus` (which is kept for backward compat — used by list page).

### `GET /api/admin/merchants/[id]/accounts`

Returns array of `User` for this merchant (excluding `passwordHash`):

```ts
{ id, username, isActive, createdAt }[]
```

### `POST /api/admin/merchants/[id]/accounts`

Creates a new `User` with `role='merchant'`, `merchantId=id`. Body: `{ username, password }`.

Validation:
- `username` min 3, unique (service throws `UsernameConflictError` if taken)
- `password` min 8

Returns created user `{ id, username, isActive, createdAt }`.

### `PATCH /api/admin/merchants/[id]/accounts/[userId]`

Accepts `{ password }` (change password) OR `{ isActive }` (toggle). One at a time.

Guard: userId must belong to this merchantId (prevent cross-merchant edits).

### `DELETE /api/admin/merchants/[id]/accounts/[userId]`

Deletes user. Guard:
- userId must belong to this merchantId
- At least 1 other user must remain for this merchant (returns 409 if last account)

---

## 3. Service Layer — `adminMerchantService.ts`

New / updated functions:

```ts
updateMerchant(id: string, data: UpdateMerchantInput): Promise<Merchant>
listMerchantAccounts(merchantId: string): Promise<AccountRow[]>
createMerchantAccount(merchantId: string, input: { username, password }): Promise<AccountRow>
updateMerchantAccount(merchantId: string, userId: string, input: { password? } | { isActive? }): Promise<void>
deleteMerchantAccount(merchantId: string, userId: string): Promise<void>
```

Error classes added:
- `UsernameConflictError` — username already taken
- `LastAccountError` — cannot delete last account

---

## 4. Worker Site Filter

Single-line fix in `lib/services/jobPostService.ts`, function `baseWhere()`:

```ts
function baseWhere() {
  return {
    status: 'live' as const,
    deletedAt: null,
    deadline: { gte: todayStart() },
    merchant: { status: 'active' },  // ← thêm
  };
}
```

This propagates automatically to:
- Job list (`/jobs`)
- Job detail (`/jobs/[id]`) — returns null → 404
- All filter count queries (employment type, industry, merchant chips)

---

## 5. Files Changed

| File | Change |
|---|---|
| `app/admin/merchants/[id]/page.tsx` | Rebuild — tab layout, edit form, status toggle in header |
| `app/api/admin/merchants/[id]/route.ts` | Extend PATCH to accept merchant fields |
| `app/api/admin/merchants/[id]/accounts/route.ts` | New — GET list + POST create |
| `app/api/admin/merchants/[id]/accounts/[userId]/route.ts` | New — PATCH update + DELETE |
| `lib/services/adminMerchantService.ts` | Add updateMerchant + account CRUD functions + error classes |
| `lib/services/jobPostService.ts` | Add `merchant: { status: 'active' }` to baseWhere |

No schema migration needed. No new npm packages needed.

---

## 6. Out of Scope

- SSO / Google OAuth (explicitly deferred)
- Merchant-side account self-management (admin-only for now)
- Bulk operations on accounts
- Audit log for account changes
