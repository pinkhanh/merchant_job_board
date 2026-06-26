# Merchant Admin Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add active-merchant filtering to the worker site, extend the admin merchant detail page with a 2-tab layout (edit info + manage accounts), and provide full CRUD for merchant manager accounts.

**Architecture:** Service functions are added to `adminMerchantService.ts`; two new API route files handle account CRUD; the detail page is split into three client components (shell + two tab components) sharing a single fetch for the merchant header. The worker filter is a one-line change to `liveVisibleWhere()` in `jobPostService.ts`.

**Tech Stack:** Next.js App Router, Prisma ORM, Zod, Vitest (mocked Prisma for unit tests), Tailwind CSS.

## Global Constraints

- All Vitest tests mock `@/lib/db/prisma` — never hit a real database in tests.
- Route handlers are tested by calling exported functions directly (e.g. `GET(new Request(...))`) — no HTTP server.
- Test command: `npm test -- tests/path/file.test.ts` (runs `vitest run` scoped to one file).
- Full suite: `npm test`.
- No new npm packages.
- All user-facing strings in Vietnamese.
- `passwordHash` must never appear in API responses.
- Tailwind classes follow existing patterns: `bg-primary`, `text-primary`, `border-border`, `bg-status-active-bg`, `bg-status-off-bg`, `text-status-active-text`, `text-status-off-text`, `bg-primary-surface`, `hover:bg-primary-hover`, `shadow-card`.

---

## File Map

| Action | Path |
|---|---|
| Modify | `lib/services/jobPostService.ts` |
| Modify | `tests/services/jobPostService-public.test.ts` |
| Modify | `lib/services/adminMerchantService.ts` |
| Modify | `tests/services/adminMerchantService.test.ts` |
| Modify | `app/api/admin/merchants/[id]/route.ts` |
| Modify | `tests/api/admin-merchants.test.ts` |
| Create | `app/api/admin/merchants/[id]/accounts/route.ts` |
| Create | `app/api/admin/merchants/[id]/accounts/[userId]/route.ts` |
| Create | `tests/api/admin-merchant-accounts.test.ts` |
| Modify | `app/admin/merchants/[id]/page.tsx` |
| Create | `app/admin/merchants/[id]/MerchantInfoTab.tsx` |
| Create | `app/admin/merchants/[id]/AccountsTab.tsx` |

---

## Task 1: Worker site — filter jobs by active merchant

**Files:**
- Modify: `lib/services/jobPostService.ts` (function `liveVisibleWhere`, lines ~151-153; function `getPublicJobPostById`, lines ~266-269)
- Modify: `tests/services/jobPostService-public.test.ts`

**Interfaces:**
- Produces: `liveVisibleWhere()` now returns `{ ..., merchant: { status: 'active' } }` — consumed by all public job queries in the same file.

- [ ] **Step 1: Write the failing test**

Add this test to `tests/services/jobPostService-public.test.ts`, inside the existing `describe('jobPostService.listPublicJobPosts', ...)` block:

```ts
it('only returns jobs from active merchants', async () => {
  await listPublicJobPosts();
  const where = (prisma.jobPost.findMany as any).mock.calls[0][0].where;
  expect(where.merchant).toEqual({ status: 'active' });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npm test -- tests/services/jobPostService-public.test.ts
```

Expected: FAIL — `expected undefined to equal { status: 'active' }`

- [ ] **Step 3: Add `merchant: { status: 'active' }` to `liveVisibleWhere`**

In `lib/services/jobPostService.ts`, change:

```ts
function liveVisibleWhere() {
  return { status: 'live' as const, deletedAt: null, deadline: { gte: todayStart() } };
}
```

To:

```ts
function liveVisibleWhere() {
  return { status: 'live' as const, deletedAt: null, deadline: { gte: todayStart() }, merchant: { status: 'active' as const } };
}
```

- [ ] **Step 4: Also add the filter to `getPublicJobPostById`**

In `lib/services/jobPostService.ts`, change the `where` clause inside `getPublicJobPostById`:

```ts
// Before:
where: { id, status: 'live', deletedAt: null },

// After:
where: { id, status: 'live', deletedAt: null, merchant: { status: 'active' } },
```

- [ ] **Step 5: Run tests to verify they pass**

```
npm test -- tests/services/jobPostService-public.test.ts
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/services/jobPostService.ts tests/services/jobPostService-public.test.ts
git commit -m "feat: filter public jobs to active merchants only"
```

---

## Task 2: adminMerchantService — updateMerchant + account CRUD

**Files:**
- Modify: `lib/services/adminMerchantService.ts`
- Modify: `tests/services/adminMerchantService.test.ts`

**Interfaces:**
- Produces:
  - `updateMerchant(id: string, rawInput: unknown): Promise<Merchant>`
  - `listMerchantAccounts(merchantId: string): Promise<{ id, username, isActive, createdAt }[]>`
  - `createMerchantAccount(merchantId: string, rawInput: unknown): Promise<{ id, username, isActive, createdAt }>`
  - `updateMerchantAccount(merchantId: string, userId: string, input: { password?: string; isActive?: boolean }): Promise<void>`
  - `deleteMerchantAccount(merchantId: string, userId: string): Promise<void>`
  - `UsernameConflictError` (class)
  - `LastAccountError` (class)

- [ ] **Step 1: Write failing tests**

Replace the entire content of `tests/services/adminMerchantService.test.ts` with the following (preserves all existing tests, adds new ones):

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    $transaction: vi.fn((fn: any) => fn({
      merchant: { create: vi.fn().mockResolvedValue({ id: 'm1', brandName: 'Jollibee' }) },
      user: { create: vi.fn().mockResolvedValue({ id: 'u1', username: 'jollibee_admin', role: 'merchant', merchantId: 'm1', isActive: true, createdAt: new Date() }) },
    })),
    merchant: { findMany: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
    user: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import {
  listMerchants,
  createMerchant,
  setMerchantStatus,
  getMerchantById,
  updateMerchant,
  listMerchantAccounts,
  createMerchantAccount,
  updateMerchantAccount,
  deleteMerchantAccount,
  UsernameConflictError,
  LastAccountError,
} from '@/lib/services/adminMerchantService';
import { prisma } from '@/lib/db/prisma';

describe('adminMerchantService', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── existing tests (unchanged) ──────────────────────────────────────────

  it('lists merchants with their store count', async () => {
    (prisma.merchant.findMany as any).mockResolvedValue([{ id: 'm1', brandName: 'Jollibee', _count: { stores: 8 } }]);

    const result = await listMerchants({});

    expect(prisma.merchant.findMany).toHaveBeenCalledWith({
      where: {},
      include: { _count: { select: { stores: true, jobPosts: true } } },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([{ id: 'm1', brandName: 'Jollibee', _count: { stores: 8 } }]);
  });

  it('creates a merchant and its first user login together', async () => {
    const result = await createMerchant({
      brandName: 'Jollibee',
      industry: 'F&B',
      username: 'jollibee_admin',
      password: 'TempPass123!',
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result.merchant.brandName).toBe('Jollibee');
    expect(result.user.username).toBe('jollibee_admin');
  });

  it('does not return passwordHash in user object', async () => {
    const result = await createMerchant({
      brandName: 'Jollibee',
      industry: 'F&B',
      username: 'jollibee_admin',
      password: 'TempPass123!',
    });

    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('activates and deactivates a merchant', async () => {
    await setMerchantStatus('m1', 'inactive');
    expect(prisma.merchant.update).toHaveBeenCalledWith({ where: { id: 'm1' }, data: { status: 'inactive' } });
  });

  it('fetches a merchant by id with its stores', async () => {
    (prisma.merchant.findUnique as any).mockResolvedValue({
      id: 'm1',
      brandName: 'Jollibee',
      stores: [{ id: 's1', name: 'Cửa hàng Quận 1' }],
    });

    const result = await getMerchantById('m1');

    expect(prisma.merchant.findUnique).toHaveBeenCalledWith({
      where: { id: 'm1' },
      include: { stores: true },
    });
    expect(result).toEqual({
      id: 'm1',
      brandName: 'Jollibee',
      stores: [{ id: 's1', name: 'Cửa hàng Quận 1' }],
    });
  });

  it('returns null when the merchant does not exist', async () => {
    (prisma.merchant.findUnique as any).mockResolvedValue(null);

    const result = await getMerchantById('missing');

    expect(result).toBeNull();
  });

  // ── updateMerchant ───────────────────────────────────────────────────────

  it('updates merchant fields via updateMerchant', async () => {
    (prisma.merchant.update as any).mockResolvedValue({ id: 'm1', brandName: 'NewName' });

    await updateMerchant('m1', { brandName: 'NewName', hotline: '0901234567' });

    expect(prisma.merchant.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { brandName: 'NewName', hotline: '0901234567' },
    });
  });

  it('updateMerchant throws ZodError when brandName is empty string', async () => {
    const { ZodError } = await import('zod');
    await expect(updateMerchant('m1', { brandName: '' })).rejects.toBeInstanceOf(ZodError);
  });

  // ── listMerchantAccounts ─────────────────────────────────────────────────

  it('lists accounts for a merchant ordered by createdAt asc', async () => {
    const mockAccounts = [
      { id: 'u1', username: 'user1', isActive: true, createdAt: new Date() },
    ];
    (prisma.user.findMany as any).mockResolvedValue(mockAccounts);

    const result = await listMerchantAccounts('m1');

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { merchantId: 'm1', role: 'merchant' },
      select: { id: true, username: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    expect(result).toEqual(mockAccounts);
  });

  // ── createMerchantAccount ────────────────────────────────────────────────

  it('creates a merchant account with hashed password', async () => {
    const created = { id: 'u2', username: 'newuser', isActive: true, createdAt: new Date() };
    (prisma.user.create as any).mockResolvedValue(created);

    const result = await createMerchantAccount('m1', { username: 'newuser', password: 'Pass1234!' });

    const callArg = (prisma.user.create as any).mock.calls[0][0];
    expect(callArg.data.username).toBe('newuser');
    expect(callArg.data.merchantId).toBe('m1');
    expect(callArg.data.role).toBe('merchant');
    expect(callArg.data.passwordHash).toBeDefined();
    expect(callArg.data.passwordHash).not.toBe('Pass1234!');
    expect(result).toEqual(created);
  });

  it('throws UsernameConflictError on P2002', async () => {
    (prisma.user.create as any).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed.', {
        code: 'P2002',
        clientVersion: 'test',
      })
    );

    await expect(
      createMerchantAccount('m1', { username: 'taken', password: 'Pass1234!' })
    ).rejects.toBeInstanceOf(UsernameConflictError);
  });

  it('createMerchantAccount throws ZodError when password is too short', async () => {
    const { ZodError } = await import('zod');
    await expect(
      createMerchantAccount('m1', { username: 'ok', password: 'short' })
    ).rejects.toBeInstanceOf(ZodError);
  });

  // ── updateMerchantAccount ────────────────────────────────────────────────

  it('changes password when password key is provided', async () => {
    (prisma.user.findFirst as any).mockResolvedValue({ id: 'u1', merchantId: 'm1' });

    await updateMerchantAccount('m1', 'u1', { password: 'NewPass123!' });

    const updateCall = (prisma.user.update as any).mock.calls[0][0];
    expect(updateCall.where).toEqual({ id: 'u1' });
    expect(updateCall.data.passwordHash).toBeDefined();
    expect(updateCall.data.isActive).toBeUndefined();
  });

  it('toggles isActive when isActive key is provided', async () => {
    (prisma.user.findFirst as any).mockResolvedValue({ id: 'u1', merchantId: 'm1' });

    await updateMerchantAccount('m1', 'u1', { isActive: false });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { isActive: false },
    });
  });

  it('throws when userId does not belong to merchantId', async () => {
    (prisma.user.findFirst as any).mockResolvedValue(null);

    await expect(updateMerchantAccount('m1', 'u-other', { isActive: false })).rejects.toThrow('Not found');
  });

  // ── deleteMerchantAccount ────────────────────────────────────────────────

  it('deletes an account when merchant has more than one', async () => {
    (prisma.user.count as any).mockResolvedValue(2);
    (prisma.user.findFirst as any).mockResolvedValue({ id: 'u1', merchantId: 'm1' });

    await deleteMerchantAccount('m1', 'u1');

    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('throws LastAccountError when only one account remains', async () => {
    (prisma.user.count as any).mockResolvedValue(1);

    await expect(deleteMerchantAccount('m1', 'u1')).rejects.toBeInstanceOf(LastAccountError);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('throws when userId does not belong to merchantId on delete', async () => {
    (prisma.user.count as any).mockResolvedValue(3);
    (prisma.user.findFirst as any).mockResolvedValue(null);

    await expect(deleteMerchantAccount('m1', 'u-other')).rejects.toThrow('Not found');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- tests/services/adminMerchantService.test.ts
```

Expected: multiple FAIL — new imports not found.

- [ ] **Step 3: Add new functions to `lib/services/adminMerchantService.ts`**

Add the following at the top of the file (alongside existing imports):

```ts
import { Prisma } from '@prisma/client';
```

Then append all of the following after the existing `getMerchantById` function:

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

export async function updateMerchant(id: string, rawInput: unknown) {
  const input = updateMerchantSchema.parse(rawInput);
  return prisma.merchant.update({ where: { id }, data: input });
}

const ACCOUNT_SELECT = {
  id: true,
  username: true,
  isActive: true,
  createdAt: true,
} as const;

export async function listMerchantAccounts(merchantId: string) {
  return prisma.user.findMany({
    where: { merchantId, role: 'merchant' },
    select: ACCOUNT_SELECT,
    orderBy: { createdAt: 'asc' },
  });
}

export class UsernameConflictError extends Error {}
export class LastAccountError extends Error {}

export const createMerchantAccountSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
});

export async function createMerchantAccount(merchantId: string, rawInput: unknown) {
  const { username, password } = createMerchantAccountSchema.parse(rawInput);
  const passwordHash = await hashPassword(password);
  try {
    return await prisma.user.create({
      data: { username, passwordHash, role: 'merchant', merchantId, isActive: true },
      select: ACCOUNT_SELECT,
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new UsernameConflictError();
    }
    throw e;
  }
}

export async function updateMerchantAccount(
  merchantId: string,
  userId: string,
  input: { password?: string; isActive?: boolean }
) {
  const user = await prisma.user.findFirst({ where: { id: userId, merchantId } });
  if (!user) throw new Error('Not found');

  if (input.password !== undefined) {
    const passwordHash = await hashPassword(input.password);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  } else if (input.isActive !== undefined) {
    await prisma.user.update({ where: { id: userId }, data: { isActive: input.isActive } });
  }
}

export async function deleteMerchantAccount(merchantId: string, userId: string) {
  const count = await prisma.user.count({ where: { merchantId } });
  if (count <= 1) throw new LastAccountError();

  const user = await prisma.user.findFirst({ where: { id: userId, merchantId } });
  if (!user) throw new Error('Not found');

  await prisma.user.delete({ where: { id: userId } });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- tests/services/adminMerchantService.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/services/adminMerchantService.ts tests/services/adminMerchantService.test.ts
git commit -m "feat: add updateMerchant and account CRUD to adminMerchantService"
```

---

## Task 3: Extend `PATCH /api/admin/merchants/[id]` to update merchant fields

**Files:**
- Modify: `app/api/admin/merchants/[id]/route.ts`
- Modify: `tests/api/admin-merchants.test.ts`

**Interfaces:**
- Consumes: `updateMerchant` from Task 2 (replaces `setMerchantStatus` call in the route).
- The list page (`app/admin/merchants/page.tsx`) calls this PATCH with `{ status }` — still works because `updateMerchantSchema` accepts `status` as an optional field.

- [ ] **Step 1: Update the existing PATCH test and add a new one**

In `tests/api/admin-merchants.test.ts`, the import line and the PATCH test need updating. Replace the file with:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

vi.mock('@/lib/auth/getSession');
vi.mock('@/lib/services/adminMerchantService');

import { GET, POST } from '@/app/api/admin/merchants/route';
import { GET as GET_ONE, PATCH } from '@/app/api/admin/merchants/[id]/route';
import { getSession } from '@/lib/auth/getSession';
import * as adminMerchantService from '@/lib/services/adminMerchantService';

function makeP2002Error() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed.', {
    code: 'P2002',
    clientVersion: 'test',
  });
}

describe('admin merchants API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET returns 401 for a non-admin session', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    const res = await GET(new Request('http://localhost/api/admin/merchants'));
    expect(res.status).toBe(401);
  });

  it('GET lists merchants for an admin session', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminMerchantService.listMerchants).mockResolvedValue([{ id: 'm1' }] as any);

    const res = await GET(new Request('http://localhost/api/admin/merchants'));
    expect(res.status).toBe(200);
  });

  it('POST creates a merchant', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminMerchantService.createMerchant).mockResolvedValue({ merchant: { id: 'm1' }, user: { id: 'u1' } } as any);

    const req = new Request('http://localhost/api/admin/merchants', { method: 'POST', body: JSON.stringify({ brandName: 'x' }) });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('POST returns 400 when createMerchant rejects with a ZodError', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminMerchantService.createMerchant).mockRejectedValue(new ZodError([]));

    const req = new Request('http://localhost/api/admin/merchants', { method: 'POST', body: JSON.stringify({ brandName: 'x' }) });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST returns 409 when createMerchant rejects with a P2002 duplicate-username error', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminMerchantService.createMerchant).mockRejectedValue(makeP2002Error());

    const req = new Request('http://localhost/api/admin/merchants', { method: 'POST', body: JSON.stringify({ brandName: 'x' }) });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('PATCH updates merchant fields', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminMerchantService.updateMerchant).mockResolvedValue({} as any);

    const req = new Request('http://localhost/api/admin/merchants/m1', {
      method: 'PATCH',
      body: JSON.stringify({ brandName: 'NewName', hotline: '0901234567' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'm1' }) });

    expect(adminMerchantService.updateMerchant).toHaveBeenCalledWith('m1', { brandName: 'NewName', hotline: '0901234567' });
    expect(res.status).toBe(200);
  });

  it('PATCH toggles merchant status', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminMerchantService.updateMerchant).mockResolvedValue({} as any);

    const req = new Request('http://localhost/api/admin/merchants/m1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'inactive' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'm1' }) });

    expect(adminMerchantService.updateMerchant).toHaveBeenCalledWith('m1', { status: 'inactive' });
    expect(res.status).toBe(200);
  });

  it('PATCH returns 400 on invalid input', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminMerchantService.updateMerchant).mockRejectedValue(new ZodError([]));

    const req = new Request('http://localhost/api/admin/merchants/m1', {
      method: 'PATCH',
      body: JSON.stringify({ brandName: '' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'm1' }) });
    expect(res.status).toBe(400);
  });

  it('GET /:id returns 401 for a non-admin session', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });
    const res = await GET_ONE(new Request('http://localhost/api/admin/merchants/m1'), { params: Promise.resolve({ id: 'm1' }) });
    expect(res.status).toBe(401);
  });

  it('GET /:id returns 404 when the merchant does not exist', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminMerchantService.getMerchantById).mockResolvedValue(null);

    const res = await GET_ONE(new Request('http://localhost/api/admin/merchants/missing'), { params: Promise.resolve({ id: 'missing' }) });
    expect(res.status).toBe(404);
  });

  it('GET /:id returns the merchant with its stores for an admin session', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u2', role: 'admin', merchantId: null });
    vi.mocked(adminMerchantService.getMerchantById).mockResolvedValue({
      id: 'm1',
      brandName: 'Jollibee',
      stores: [{ id: 's1', name: 'Cửa hàng Quận 1' }],
    } as any);

    const res = await GET_ONE(new Request('http://localhost/api/admin/merchants/m1'), { params: Promise.resolve({ id: 'm1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      id: 'm1',
      brandName: 'Jollibee',
      stores: [{ id: 's1', name: 'Cửa hàng Quận 1' }],
    });
    expect(adminMerchantService.getMerchantById).toHaveBeenCalledWith('m1');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- tests/api/admin-merchants.test.ts
```

Expected: FAIL — `updateMerchant` not imported / `setMerchantStatus` assertion no longer matches.

- [ ] **Step 3: Update the route handler**

Replace the entire content of `app/api/admin/merchants/[id]/route.ts` with:

```ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getSession } from '@/lib/auth/getSession';
import { getMerchantById, updateMerchant } from '@/lib/services/adminMerchantService';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const merchant = await getMerchantById(id);
  if (!merchant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(merchant);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  try {
    await updateMerchant(id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    throw e;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- tests/api/admin-merchants.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/merchants/[id]/route.ts tests/api/admin-merchants.test.ts
git commit -m "feat: extend PATCH /admin/merchants/:id to accept merchant fields"
```

---

## Task 4: Account API routes

**Files:**
- Create: `app/api/admin/merchants/[id]/accounts/route.ts`
- Create: `app/api/admin/merchants/[id]/accounts/[userId]/route.ts`
- Create: `tests/api/admin-merchant-accounts.test.ts`

**Interfaces:**
- Consumes: `listMerchantAccounts`, `createMerchantAccount`, `updateMerchantAccount`, `deleteMerchantAccount`, `UsernameConflictError`, `LastAccountError` from Task 2.

- [ ] **Step 1: Write failing tests**

Create `tests/api/admin-merchant-accounts.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZodError } from 'zod';

vi.mock('@/lib/auth/getSession');

// Factory mock: keeps real error classes so instanceof works in route handlers,
// but replaces service functions with vi.fn().
vi.mock('@/lib/services/adminMerchantService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/services/adminMerchantService')>();
  return {
    ...actual,
    listMerchantAccounts: vi.fn(),
    createMerchantAccount: vi.fn(),
    updateMerchantAccount: vi.fn(),
    deleteMerchantAccount: vi.fn(),
  };
});

import { GET, POST } from '@/app/api/admin/merchants/[id]/accounts/route';
import { PATCH, DELETE } from '@/app/api/admin/merchants/[id]/accounts/[userId]/route';
import { getSession } from '@/lib/auth/getSession';
import * as adminMerchantService from '@/lib/services/adminMerchantService';

const adminSession = { userId: 'u-admin', role: 'admin' as const, merchantId: null };
const merchantSession = { userId: 'u1', role: 'merchant' as const, merchantId: 'm1' };

describe('admin merchant accounts API', () => {
  beforeEach(() => vi.clearAllMocks());

  // GET /accounts
  it('GET returns 401 for non-admin', async () => {
    vi.mocked(getSession).mockResolvedValue(merchantSession);
    const res = await GET(new Request('http://localhost/'), { params: Promise.resolve({ id: 'm1' }) });
    expect(res.status).toBe(401);
  });

  it('GET returns list of accounts', async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    const mockAccounts = [{ id: 'u1', username: 'user1', isActive: true, createdAt: new Date() }];
    vi.mocked(adminMerchantService.listMerchantAccounts).mockResolvedValue(mockAccounts as any);

    const res = await GET(new Request('http://localhost/'), { params: Promise.resolve({ id: 'm1' }) });

    expect(adminMerchantService.listMerchantAccounts).toHaveBeenCalledWith('m1');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
  });

  // POST /accounts
  it('POST returns 401 for non-admin', async () => {
    vi.mocked(getSession).mockResolvedValue(merchantSession);
    const req = new Request('http://localhost/', { method: 'POST', body: JSON.stringify({ username: 'x', password: 'Pass1234!' }) });
    const res = await POST(req, { params: Promise.resolve({ id: 'm1' }) });
    expect(res.status).toBe(401);
  });

  it('POST creates account and returns 201', async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    const created = { id: 'u2', username: 'newuser', isActive: true, createdAt: new Date() };
    vi.mocked(adminMerchantService.createMerchantAccount).mockResolvedValue(created as any);

    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ username: 'newuser', password: 'Pass1234!' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'm1' }) });

    expect(adminMerchantService.createMerchantAccount).toHaveBeenCalledWith('m1', { username: 'newuser', password: 'Pass1234!' });
    expect(res.status).toBe(201);
  });

  it('POST returns 409 on username conflict', async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(adminMerchantService.createMerchantAccount).mockRejectedValue(
      new adminMerchantService.UsernameConflictError()
    );

    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ username: 'taken', password: 'Pass1234!' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'm1' }) });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('Tên đăng nhập đã tồn tại');
  });

  it('POST returns 400 on ZodError', async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(adminMerchantService.createMerchantAccount).mockRejectedValue(new ZodError([]));

    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ username: 'x', password: 'short' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'm1' }) });
    expect(res.status).toBe(400);
  });

  // PATCH /accounts/[userId]
  it('PATCH returns 401 for non-admin', async () => {
    vi.mocked(getSession).mockResolvedValue(merchantSession);
    const req = new Request('http://localhost/', { method: 'PATCH', body: JSON.stringify({ isActive: false }) });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'm1', userId: 'u1' }) });
    expect(res.status).toBe(401);
  });

  it('PATCH updates account and returns 200', async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(adminMerchantService.updateMerchantAccount).mockResolvedValue(undefined);

    const req = new Request('http://localhost/', {
      method: 'PATCH',
      body: JSON.stringify({ isActive: false }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'm1', userId: 'u1' }) });

    expect(adminMerchantService.updateMerchantAccount).toHaveBeenCalledWith('m1', 'u1', { isActive: false });
    expect(res.status).toBe(200);
  });

  // DELETE /accounts/[userId]
  it('DELETE returns 401 for non-admin', async () => {
    vi.mocked(getSession).mockResolvedValue(merchantSession);
    const req = new Request('http://localhost/', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'm1', userId: 'u1' }) });
    expect(res.status).toBe(401);
  });

  it('DELETE removes account and returns 200', async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(adminMerchantService.deleteMerchantAccount).mockResolvedValue(undefined);

    const req = new Request('http://localhost/', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'm1', userId: 'u1' }) });

    expect(adminMerchantService.deleteMerchantAccount).toHaveBeenCalledWith('m1', 'u1');
    expect(res.status).toBe(200);
  });

  it('DELETE returns 409 when last account', async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(adminMerchantService.deleteMerchantAccount).mockRejectedValue(
      new adminMerchantService.LastAccountError()
    );

    const req = new Request('http://localhost/', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'm1', userId: 'u1' }) });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('Phải có ít nhất 1 tài khoản');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- tests/api/admin-merchant-accounts.test.ts
```

Expected: FAIL — route files don't exist.

- [ ] **Step 3: Create `app/api/admin/merchants/[id]/accounts/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getSession } from '@/lib/auth/getSession';
import {
  listMerchantAccounts,
  createMerchantAccount,
  UsernameConflictError,
} from '@/lib/services/adminMerchantService';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const accounts = await listMerchantAccounts(id);
  return NextResponse.json(accounts);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  try {
    const account = await createMerchantAccount(id, body);
    return NextResponse.json(account, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    if (e instanceof UsernameConflictError) return NextResponse.json({ error: 'Tên đăng nhập đã tồn tại' }, { status: 409 });
    throw e;
  }
}
```

- [ ] **Step 4: Create `app/api/admin/merchants/[id]/accounts/[userId]/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import {
  updateMerchantAccount,
  deleteMerchantAccount,
  LastAccountError,
} from '@/lib/services/adminMerchantService';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, userId } = await params;
  const body = await req.json();
  await updateMerchantAccount(id, userId, body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, userId } = await params;
  try {
    await deleteMerchantAccount(id, userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof LastAccountError) {
      return NextResponse.json({ error: 'Phải có ít nhất 1 tài khoản' }, { status: 409 });
    }
    throw e;
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```
npm test -- tests/api/admin-merchant-accounts.test.ts
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/merchants/[id]/accounts/ tests/api/admin-merchant-accounts.test.ts
git commit -m "feat: add account CRUD API routes for admin merchant management"
```

---

## Task 5: Rebuild admin merchant detail page with tab layout

**Files:**
- Modify: `app/admin/merchants/[id]/page.tsx`
- Create: `app/admin/merchants/[id]/MerchantInfoTab.tsx`
- Create: `app/admin/merchants/[id]/AccountsTab.tsx`

No unit tests for React client components (no component testing infrastructure in this codebase). Verify manually by running the dev server.

**Interfaces:**
- Consumes: `GET /api/admin/merchants/[id]` (existing), `PATCH /api/admin/merchants/[id]` (Task 3), `GET /api/admin/merchants/[id]/accounts` (Task 4), `POST`, `PATCH`, `DELETE` account routes (Task 4).
- Consumes: `MerchantProfileView` from `@/components/MerchantProfileView`, `useToast` from `@/components/Toast`.

- [ ] **Step 1: Replace `app/admin/merchants/[id]/page.tsx` (shell + tab routing)**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import MerchantInfoTab from './MerchantInfoTab';
import AccountsTab from './AccountsTab';

type MerchantHeader = {
  brandName: string;
  status: 'active' | 'inactive';
};

export default function AdminMerchantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useToast();
  const tab = searchParams.get('tab') ?? 'info';

  const [merchant, setMerchant] = useState<MerchantHeader | null>(null);

  useEffect(() => {
    fetch(`/api/admin/merchants/${id}`)
      .then((r) => r.json())
      .then((data) => setMerchant({ brandName: data.brandName, status: data.status }));
  }, [id]);

  async function toggleStatus() {
    if (!merchant) return;
    const next = merchant.status === 'active' ? 'inactive' : 'active';
    const res = await fetch(`/api/admin/merchants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setMerchant((m) => (m ? { ...m, status: next } : m));
      showToast('success', next === 'active' ? 'Đã kích hoạt merchant' : 'Đã tạm ngưng merchant');
    } else {
      showToast('error', 'Cập nhật thất bại, vui lòng thử lại');
    }
  }

  if (!merchant) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/merchants')}
            className="text-sm text-primary hover:underline"
          >
            ← Quay lại
          </button>
          <h1 className="text-2xl font-bold">{merchant.brandName}</h1>
        </div>
        <button
          onClick={toggleStatus}
          className={`text-[11px] font-medium px-3 py-1 rounded-sm ${
            merchant.status === 'active'
              ? 'bg-status-active-bg text-status-active-text'
              : 'bg-status-off-bg text-status-off-text'
          }`}
        >
          {merchant.status === 'active' ? 'Hoạt động' : 'Tạm ngưng'}
        </button>
      </div>

      <div className="flex border-b border-border mb-6">
        {(['info', 'accounts'] as const).map((t) => (
          <button
            key={t}
            onClick={() => router.replace(`/admin/merchants/${id}?tab=${t}`)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-primary'
            }`}
          >
            {t === 'info' ? 'Thông tin chung' : 'Tài khoản'}
          </button>
        ))}
      </div>

      {tab === 'info' ? (
        <MerchantInfoTab
          merchantId={id}
          onBrandNameChange={(name) => setMerchant((m) => (m ? { ...m, brandName: name } : m))}
        />
      ) : (
        <AccountsTab merchantId={id} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `app/admin/merchants/[id]/MerchantInfoTab.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { MerchantProfileView, type ProfileStore } from '@/components/MerchantProfileView';
import { useToast } from '@/components/Toast';

const PREVIEW_STORE_COUNT = 3;

type MerchantDetail = {
  brandName: string;
  description: string | null;
  hotline: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  industry: string;
  jobCategories: string[];
  stores: ProfileStore[];
};

type FormState = {
  brandName: string;
  industry: string;
  hotline: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  jobCategories: string[];
  tagInput: string;
};

export default function MerchantInfoTab({
  merchantId,
  onBrandNameChange,
}: {
  merchantId: string;
  onBrandNameChange: (name: string) => void;
}) {
  const showToast = useToast();
  const [merchant, setMerchant] = useState<MerchantDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAllStores, setShowAllStores] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/merchants/${merchantId}`)
      .then((r) => r.json())
      .then((data: MerchantDetail) => setMerchant(data));
  }, [merchantId]);

  function startEdit() {
    if (!merchant) return;
    setForm({
      brandName: merchant.brandName,
      industry: merchant.industry,
      hotline: merchant.hotline ?? '',
      description: merchant.description ?? '',
      logoUrl: merchant.logoUrl ?? '',
      bannerUrl: merchant.bannerUrl ?? '',
      jobCategories: [...merchant.jobCategories],
      tagInput: '',
    });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setForm(null);
  }

  async function saveEdit() {
    if (!form) return;
    setSaving(true);
    const payload = {
      brandName: form.brandName,
      industry: form.industry,
      hotline: form.hotline || null,
      description: form.description || null,
      logoUrl: form.logoUrl || null,
      bannerUrl: form.bannerUrl || null,
      jobCategories: form.jobCategories,
    };
    const res = await fetch(`/api/admin/merchants/${merchantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      setMerchant((m) => (m ? { ...m, ...payload } : m));
      onBrandNameChange(form.brandName);
      setEditing(false);
      setForm(null);
      showToast('success', 'Đã lưu thông tin merchant');
    } else {
      showToast('error', 'Lưu thất bại, vui lòng thử lại');
    }
  }

  function addTag() {
    if (!form) return;
    const tag = form.tagInput.trim();
    if (tag && !form.jobCategories.includes(tag)) {
      setForm({ ...form, jobCategories: [...form.jobCategories, tag], tagInput: '' });
    } else {
      setForm({ ...form, tagInput: '' });
    }
  }

  function removeTag(tag: string) {
    if (!form) return;
    setForm({ ...form, jobCategories: form.jobCategories.filter((t) => t !== tag) });
  }

  if (!merchant) return null;

  const stores = merchant.stores ?? [];

  if (editing && form) {
    return (
      <div className="bg-white border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-6">Chỉnh sửa thông tin</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Tên thương hiệu *
            </label>
            <input
              value={form.brandName}
              onChange={(e) => setForm({ ...form, brandName: e.target.value })}
              className="border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Ngành nghề *
            </label>
            <input
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              className="border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Hotline
            </label>
            <input
              value={form.hotline}
              onChange={(e) => setForm({ ...form, hotline: e.target.value })}
              className="border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Logo URL
            </label>
            <input
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              className="border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Banner URL
            </label>
            <input
              value={form.bannerUrl}
              onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
              className="border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Mô tả (tối đa 500 ký tự)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={500}
              rows={4}
              className="border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 resize-none"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Danh mục việc làm
            </label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
              {form.jobCategories.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 bg-primary-surface text-primary text-sm px-2 py-0.5 rounded-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-500 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              value={form.tagInput}
              onChange={(e) => setForm({ ...form, tagInput: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Nhập và nhấn Enter hoặc dấu phẩy để thêm"
              className="border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={cancelEdit}
            className="px-4 py-2 text-sm border border-border rounded-md hover:bg-primary-surface"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={saveEdit}
            disabled={saving || !form.brandName.trim() || !form.industry.trim()}
            className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={startEdit}
          className="px-4 py-2 text-sm border border-primary text-primary rounded-md hover:bg-primary-surface"
        >
          Chỉnh sửa
        </button>
      </div>
      <MerchantProfileView
        brandName={merchant.brandName}
        logoUrl={merchant.logoUrl}
        bannerUrl={merchant.bannerUrl}
        industry={merchant.industry}
        hotline={merchant.hotline}
        description={merchant.description}
        jobCategories={merchant.jobCategories}
        stores={stores}
        storeTotal={stores.length}
        readOnly
        expandedStoresSlot={
          !showAllStores ? (
            stores.length > PREVIEW_STORE_COUNT && (
              <button
                onClick={() => setShowAllStores(true)}
                className="text-primary text-sm hover:underline mt-3"
              >
                Xem tất cả cửa hàng
              </button>
            )
          ) : (
            <ul className="mt-4 bg-white border border-border rounded-lg divide-y divide-border">
              {stores.slice(PREVIEW_STORE_COUNT).map((s) => (
                <li key={s.id} className="px-4 py-3">
                  {s.name}
                </li>
              ))}
            </ul>
          )
        }
      />
    </div>
  );
}
```

- [ ] **Step 3: Create `app/admin/merchants/[id]/AccountsTab.tsx`**

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';

type Account = {
  id: string;
  username: string;
  isActive: boolean;
  createdAt: string;
};

type RowAction = { type: 'password' } | { type: 'delete' } | null;

export default function AccountsTab({ merchantId }: { merchantId: string }) {
  const showToast = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [rowAction, setRowAction] = useState<Record<string, RowAction>>({});
  const [pwForm, setPwForm] = useState<Record<string, { password: string; confirm: string }>>({});

  useEffect(() => {
    fetch(`/api/admin/merchants/${merchantId}/accounts`)
      .then((r) => r.json())
      .then(setAccounts);
  }, [merchantId]);

  function toggleRowAction(accountId: string, type: 'password' | 'delete') {
    setRowAction((prev) => ({
      ...prev,
      [accountId]: prev[accountId]?.type === type ? null : { type },
    }));
    if (type === 'password') {
      setPwForm((prev) => ({ ...prev, [accountId]: { password: '', confirm: '' } }));
    }
  }

  async function handleAdd() {
    if (addForm.password !== addForm.confirmPassword) {
      showToast('error', 'Mật khẩu xác nhận không khớp');
      return;
    }
    const res = await fetch(`/api/admin/merchants/${merchantId}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: addForm.username, password: addForm.password }),
    });
    if (res.ok) {
      const newAccount: Account = await res.json();
      setAccounts((prev) => [newAccount, ...prev]);
      setShowAddForm(false);
      setAddForm({ username: '', password: '', confirmPassword: '' });
      showToast('success', 'Đã tạo tài khoản');
    } else {
      const body = await res.json();
      showToast('error', body.error ?? 'Tạo tài khoản thất bại');
    }
  }

  async function toggleActive(account: Account) {
    const res = await fetch(`/api/admin/merchants/${merchantId}/accounts/${account.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !account.isActive }),
    });
    if (res.ok) {
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, isActive: !a.isActive } : a))
      );
      showToast('success', !account.isActive ? 'Đã mở tài khoản' : 'Đã khoá tài khoản');
    } else {
      showToast('error', 'Cập nhật thất bại');
    }
  }

  async function handlePasswordChange(accountId: string) {
    const f = pwForm[accountId];
    if (!f) return;
    if (f.password !== f.confirm) {
      showToast('error', 'Mật khẩu xác nhận không khớp');
      return;
    }
    const res = await fetch(`/api/admin/merchants/${merchantId}/accounts/${accountId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: f.password }),
    });
    if (res.ok) {
      setRowAction((prev) => ({ ...prev, [accountId]: null }));
      setPwForm((prev) => {
        const copy = { ...prev };
        delete copy[accountId];
        return copy;
      });
      showToast('success', 'Đã đổi mật khẩu');
    } else {
      showToast('error', 'Đổi mật khẩu thất bại');
    }
  }

  async function handleDelete(accountId: string) {
    const res = await fetch(`/api/admin/merchants/${merchantId}/accounts/${accountId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      setRowAction((prev) => {
        const copy = { ...prev };
        delete copy[accountId];
        return copy;
      });
      showToast('success', 'Đã xoá tài khoản');
    } else {
      const body = await res.json();
      showToast('error', body.error ?? 'Xoá thất bại');
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Tài khoản quản lý</h2>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-hover"
        >
          + Thêm mới
        </button>
      </div>

      {showAddForm && (
        <div className="bg-primary-surface border border-border rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold mb-3">Tạo tài khoản mới</h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Tên đăng nhập
              </label>
              <input
                value={addForm.username}
                onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                className="border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Mật khẩu
              </label>
              <input
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                className="border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                value={addForm.confirmPassword}
                onChange={(e) => setAddForm({ ...addForm, confirmPassword: e.target.value })}
                className="border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setAddForm({ username: '', password: '', confirmPassword: '' });
              }}
              className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-white"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!addForm.username || !addForm.password || !addForm.confirmPassword}
              className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50"
            >
              Tạo tài khoản
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-primary text-white text-xs uppercase">
              <th className="px-4 py-3 text-left">Tên đăng nhập</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              <th className="px-4 py-3 text-left">Ngày tạo</th>
              <th className="px-4 py-3 text-left">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <React.Fragment key={account.id}>
                <tr className="border-b border-border hover:bg-primary-surface">
                  <td className="px-4 py-3 font-medium">{account.username}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${
                        account.isActive
                          ? 'bg-status-active-bg text-status-active-text'
                          : 'bg-status-off-bg text-status-off-text'
                      }`}
                    >
                      {account.isActive ? 'Hoạt động' : 'Đã khoá'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {new Date(account.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toggleRowAction(account.id, 'password')}
                        className="text-xs px-2 py-1 border border-border rounded hover:bg-primary-surface"
                      >
                        Đổi MK
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(account)}
                        className="text-xs px-2 py-1 border border-border rounded hover:bg-primary-surface"
                      >
                        {account.isActive ? 'Khoá' : 'Mở'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleRowAction(account.id, 'delete')}
                        disabled={accounts.length <= 1}
                        title={accounts.length <= 1 ? 'Không thể xoá tài khoản duy nhất' : undefined}
                        className="text-xs px-2 py-1 border border-border rounded hover:bg-primary-surface disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>

                {rowAction[account.id]?.type === 'password' && (
                  <tr className="bg-primary-surface border-b border-border">
                    <td colSpan={4} className="px-4 py-3">
                      <div className="flex items-end gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-text-secondary">
                            Mật khẩu mới
                          </label>
                          <input
                            type="password"
                            value={pwForm[account.id]?.password ?? ''}
                            onChange={(e) =>
                              setPwForm((prev) => ({
                                ...prev,
                                [account.id]: { ...prev[account.id], password: e.target.value },
                              }))
                            }
                            className="border border-border rounded-md px-3 py-1.5 text-sm focus:border-primary focus:outline-none bg-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-text-secondary">Xác nhận</label>
                          <input
                            type="password"
                            value={pwForm[account.id]?.confirm ?? ''}
                            onChange={(e) =>
                              setPwForm((prev) => ({
                                ...prev,
                                [account.id]: { ...prev[account.id], confirm: e.target.value },
                              }))
                            }
                            className="border border-border rounded-md px-3 py-1.5 text-sm focus:border-primary focus:outline-none bg-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePasswordChange(account.id)}
                          disabled={!pwForm[account.id]?.password}
                          className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50"
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => setRowAction((prev) => ({ ...prev, [account.id]: null }))}
                          className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-white"
                        >
                          Huỷ
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {rowAction[account.id]?.type === 'delete' && (
                  <tr className="bg-red-50 border-b border-border">
                    <td colSpan={4} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-red-700">
                          Xác nhận xoá tài khoản{' '}
                          <strong>{account.username}</strong>?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDelete(account.id)}
                          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          Xoá
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setRowAction((prev) => ({ ...prev, [account.id]: null }))
                          }
                          className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-white"
                        >
                          Huỷ
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-text-secondary text-sm">
                  Chưa có tài khoản nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run full test suite**

```
npm test
```

Expected: all existing tests still PASS (no regressions). New test files from Tasks 1–4 also pass.

- [ ] **Step 5: Commit**

```bash
git add app/admin/merchants/[id]/
git commit -m "feat: rebuild merchant detail page with 2-tab layout (info + accounts)"
```

---

## Final Verification

- [ ] Run `npm test` — full suite must pass.
- [ ] Start dev server (`npm run dev`) and manually verify:
  - `/admin/merchants/[id]?tab=info` — shows Thông tin chung, "Chỉnh sửa" button opens edit form, save updates header brand name, cancel discards.
  - Toggle active/inactive in header — updates badge, toast appears.
  - `/admin/merchants/[id]?tab=accounts` — table shows accounts, "Thêm mới" creates account, "Đổi MK" changes password inline, "Khoá/Mở" toggles isActive, "Xoá" disabled when 1 account, confirm row before deleting.
  - Worker site (`/jobs`) — jobs from inactive merchants are hidden.
