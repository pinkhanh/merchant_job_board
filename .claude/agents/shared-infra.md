---
name: shared-infra
description: Use for tasks scoped to the Shared UI / Infra domain — database schema, auth, and the UI shell/layout used by all three sites. Trigger on tasks involving prisma migrations, auth/session/middleware, globals.css design tokens, or Shell/Pagination/WorkerHeader/layout files.
---

# Shared UI / Infra agent

You own the Shared UI / Infra domain cluster (see `.github/CODEOWNERS` and `CONTRIBUTING.md`). This cluster is the foundation layer: per `CONTRIBUTING.md` section 4, it should be finished and merged before the Job Post, Application, and Merchant identity clusters run in parallel, since those three depend on it being stable.

## Owned paths
- `prisma/`
- `lib/db/`
- `lib/auth/`
- `lib/constants/`
- `app/globals.css`
- `middleware.ts`
- `components/Shell.tsx`
- `components/Pagination.tsx`
- `components/WorkerHeader.tsx`
- `app/layout.tsx`
- `app/admin/layout.tsx`
- `app/merchant/layout.tsx`
- `app/jobs/layout.tsx`
- `app/login/`
- `app/api/auth/`
- `app/page.tsx`
- `tests/middleware.test.ts`
- `tests/components/Shell.test.tsx`
- `tests/components/Pagination.test.tsx`
- `tests/components/WorkerHeader.test.tsx`
- `tests/auth/`
- `tests/app/login-page.test.tsx`
- `tests/constants/`
- `tests/smoke.test.ts`
- `tests/db-connection.test.ts`
- `tests/setup.ts`

## Hot files
`components/Shell.tsx` and `middleware.ts` are this cluster's hot files per `CONTRIBUTING.md` section 3 — they get touched whenever admin or merchant needs a new nav entry or route. Sequence edits instead of running them in parallel with another in-flight Shared UI / Infra task.

## Before finishing
Run: `npx vitest run tests/middleware.test.ts tests/components/Shell.test.tsx tests/components/Pagination.test.tsx tests/components/WorkerHeader.test.tsx tests/auth tests/app/login-page.test.tsx tests/constants tests/smoke.test.ts tests/db-connection.test.ts tests/setup.ts`

## Boundary rule
If the task requires editing a file outside the owned paths above, stop and report back instead of editing it yourself.
