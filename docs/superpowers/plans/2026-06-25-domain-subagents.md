# Domain-scoped Claude Code Subagents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 Claude Code subagent definitions under `.claude/agents/`, one per existing CODEOWNERS cluster (Job Post, Application, Merchant identity/Store, Shared UI/Infra), so dispatching cluster-scoped work doesn't require re-explaining scope, hot files, or test commands each time.

**Architecture:** Each subagent is a single static markdown file with Claude Code subagent frontmatter (`name`, `description`) and a body listing owned paths, hot-file warnings, the cluster's test command, and a boundary rule instructing the agent to stop and report back rather than edit files outside its scope.

**Tech Stack:** Claude Code subagent config format (`.claude/agents/*.md`). No code, no build step.

## Global Constraints

- Owned-path lists must match `.github/CODEOWNERS` exactly — these are not new scope decisions, just restructuring existing scope into per-agent instructions (per spec `docs/superpowers/specs/2026-06-25-domain-subagents-design.md`).
- Hot-file warnings must match `CONTRIBUTING.md` section 3.
- No tools/model restriction in frontmatter — each agent needs full read/write/test capability.
- Do not modify `CODEOWNERS`, `CONTRIBUTING.md`, or cluster boundaries as part of this work.

---

### Task 1: Job Post agent

**Files:**
- Create: `.claude/agents/job-post.md`

**Interfaces:** None (standalone static file, no code dependencies on other tasks).

- [ ] **Step 1: Write the file**

```markdown
---
name: job-post
description: Use for tasks scoped to the Job Post domain — job CRUD, moderation, and listing across admin, merchant, and worker sites. Trigger on tasks involving job posting, job status/moderation, job listing/detail pages, or jobPostService.
---

# Job Post agent

You own the Job Post domain cluster (see `.github/CODEOWNERS` and `CONTRIBUTING.md`).

## Owned paths
- `lib/services/jobPostService.ts`
- `lib/services/adminJobPostService.ts`
- `app/api/jobs/`
- `app/api/admin/jobs/`
- `app/api/worker/jobs/`
- `app/admin/jobs/`
- `app/merchant/jobs/`
- `app/merchant/dashboard/`
- `app/jobs/page.tsx`
- `app/jobs/[id]/`
- `tests/services/jobPostService*`
- `tests/services/adminJobPostService.test.ts`
- `tests/api/jobs-create.test.ts`
- `tests/api/jobs-update.test.ts`
- `tests/api/admin-jobs.test.ts`
- `tests/api/worker-jobs.test.ts`
- `tests/api/worker-job-detail.test.ts`
- `tests/app/jobs-page.test.tsx`
- `tests/app/jobs-new-page.test.tsx`
- `tests/app/merchant-jobs-page.test.tsx`
- `tests/app/job-detail-page.test.tsx`

## Hot file
`lib/services/jobPostService.ts` is touched by multiple sub-flows (admin moderation, merchant CRUD, worker listing) within this same cluster. If your task and another in-flight Job Post task both need to edit it, sequence the edits instead of running them in parallel — see `CONTRIBUTING.md` section 3.

## Before finishing
Run: `npx vitest run tests/services/jobPostService tests/services/adminJobPostService.test.ts tests/api/jobs-create.test.ts tests/api/jobs-update.test.ts tests/api/admin-jobs.test.ts tests/api/worker-jobs.test.ts tests/api/worker-job-detail.test.ts tests/app/jobs-page.test.tsx tests/app/jobs-new-page.test.tsx tests/app/merchant-jobs-page.test.tsx tests/app/job-detail-page.test.tsx`

## Boundary rule
If the task requires editing a file outside the owned paths above, stop and report back instead of editing it yourself.
```

- [ ] **Step 2: Verify frontmatter is well-formed**

Run: `grep -c '^---$' .claude/agents/job-post.md`
Expected: `2` (exactly two delimiter lines)

Run: `grep -E '^(name|description):' .claude/agents/job-post.md`
Expected: both `name: job-post` and a `description:` line are present

- [ ] **Step 3: Verify owned paths match CODEOWNERS**

Run: `grep -A 22 "Cụm: Job Post domain" .github/CODEOWNERS`
Expected: every path listed there appears in the "Owned paths" section of `.claude/agents/job-post.md` (manual visual diff — 20 paths).

- [ ] **Step 4: Commit**

```bash
git add .claude/agents/job-post.md
git commit -m "feat: add Job Post domain subagent"
```

---

### Task 2: Application agent

**Files:**
- Create: `.claude/agents/application.md`

**Interfaces:** None (standalone static file).

- [ ] **Step 1: Write the file**

```markdown
---
name: application
description: Use for tasks scoped to the Application domain — the apply/application flow across admin, merchant, and worker sites. Trigger on tasks involving applicant lists, application status, the apply modal, or applicationService.
---

# Application agent

You own the Application domain cluster (see `.github/CODEOWNERS` and `CONTRIBUTING.md`).

## Owned paths
- `lib/services/applicationService.ts`
- `lib/services/adminApplicationService.ts`
- `app/api/applications/`
- `app/api/admin/applications/`
- `app/admin/applicants/`
- `app/merchant/applicants/`
- `components/ApplyModal.tsx`
- `tests/services/applicationService*`
- `tests/services/adminApplicationService.test.ts`
- `tests/api/applications*`
- `tests/api/admin-applications.test.ts`
- `tests/app/merchant-applicants-page.test.tsx`
- `tests/components/ApplyModal.test.tsx`

## Hot file
`lib/services/applicationService.ts` is this cluster's hot file per `CONTRIBUTING.md` section 3 — if another in-flight Application task also touches it, sequence the edits instead of running them in parallel.

## Before finishing
Run: `npx vitest run tests/services/applicationService tests/services/adminApplicationService.test.ts tests/api/applications tests/api/admin-applications.test.ts tests/app/merchant-applicants-page.test.tsx tests/components/ApplyModal.test.tsx`

## Boundary rule
If the task requires editing a file outside the owned paths above, stop and report back instead of editing it yourself.
```

- [ ] **Step 2: Verify frontmatter is well-formed**

Run: `grep -c '^---$' .claude/agents/application.md`
Expected: `2`

Run: `grep -E '^(name|description):' .claude/agents/application.md`
Expected: both `name: application` and a `description:` line are present

- [ ] **Step 3: Verify owned paths match CODEOWNERS**

Run: `grep -A 13 "Cụm: Application domain" .github/CODEOWNERS`
Expected: every path listed there appears in the "Owned paths" section of `.claude/agents/application.md` (13 paths).

- [ ] **Step 4: Commit**

```bash
git add .claude/agents/application.md
git commit -m "feat: add Application domain subagent"
```

---

### Task 3: Merchant identity / Store agent

**Files:**
- Create: `.claude/agents/merchant-identity.md`

**Interfaces:** None (standalone static file).

- [ ] **Step 1: Write the file**

```markdown
---
name: merchant-identity
description: Use for tasks scoped to the Merchant identity / Store domain — merchant management, merchant profile, store listings, and AI-generated descriptions. Trigger on tasks involving merchant profile, store search/filter, or aiService.
---

# Merchant identity / Store agent

You own the Merchant identity / Store domain cluster (see `.github/CODEOWNERS` and `CONTRIBUTING.md`).

## Owned paths
- `lib/services/adminMerchantService.ts`
- `lib/services/merchantProfileService.ts`
- `lib/services/storeService.ts`
- `lib/services/aiService.ts`
- `app/api/admin/merchants/`
- `app/api/merchant/profile/`
- `app/api/merchant/stores/`
- `app/api/merchant/dashboard-counts/`
- `app/api/ai/`
- `app/admin/merchants/`
- `app/merchant/profile/`
- `lib/hooks/useStoreSearch.ts`
- `components/StoreFilterBar.tsx`
- `tests/services/adminMerchantService.test.ts`
- `tests/services/merchantProfileService.test.ts`
- `tests/services/storeService.test.ts`
- `tests/services/aiService.test.ts`
- `tests/api/admin-merchants.test.ts`
- `tests/api/merchant-profile.test.ts`
- `tests/api/merchant-stores.test.ts`
- `tests/api/merchant-dashboard-counts.test.ts`
- `tests/api/ai-generate-description.test.ts`
- `tests/app/merchant-profile-page.test.tsx`
- `tests/hooks/useStoreSearch.test.ts`
- `tests/components/StoreFilterBar.test.tsx`

## Hot files
None of this cluster's files are listed as hot files in `CONTRIBUTING.md` section 3 — it doesn't share service files with the other two domain clusters.

## Before finishing
Run: `npx vitest run tests/services/adminMerchantService.test.ts tests/services/merchantProfileService.test.ts tests/services/storeService.test.ts tests/services/aiService.test.ts tests/api/admin-merchants.test.ts tests/api/merchant-profile.test.ts tests/api/merchant-stores.test.ts tests/api/merchant-dashboard-counts.test.ts tests/api/ai-generate-description.test.ts tests/app/merchant-profile-page.test.tsx tests/hooks/useStoreSearch.test.ts tests/components/StoreFilterBar.test.tsx`

## Boundary rule
If the task requires editing a file outside the owned paths above, stop and report back instead of editing it yourself.
```

- [ ] **Step 2: Verify frontmatter is well-formed**

Run: `grep -c '^---$' .claude/agents/merchant-identity.md`
Expected: `2`

Run: `grep -E '^(name|description):' .claude/agents/merchant-identity.md`
Expected: both `name: merchant-identity` and a `description:` line are present

- [ ] **Step 3: Verify owned paths match CODEOWNERS**

Run: `grep -A 25 "Merchant identity / Store domain" .github/CODEOWNERS`
Expected: every path listed there appears in the "Owned paths" section of `.claude/agents/merchant-identity.md` (25 paths).

- [ ] **Step 4: Commit**

```bash
git add .claude/agents/merchant-identity.md
git commit -m "feat: add Merchant identity/Store domain subagent"
```

---

### Task 4: Shared UI / Infra agent

**Files:**
- Create: `.claude/agents/shared-infra.md`

**Interfaces:** None (standalone static file).

- [ ] **Step 1: Write the file**

```markdown
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
```

- [ ] **Step 2: Verify frontmatter is well-formed**

Run: `grep -c '^---$' .claude/agents/shared-infra.md`
Expected: `2`

Run: `grep -E '^(name|description):' .claude/agents/shared-infra.md`
Expected: both `name: shared-infra` and a `description:` line are present

- [ ] **Step 3: Verify owned paths match CODEOWNERS**

Run: `grep -A 27 "Cụm: Shared UI / Infra" .github/CODEOWNERS`
Expected: every path listed there appears in the "Owned paths" section of `.claude/agents/shared-infra.md` (26 paths).

- [ ] **Step 4: Commit**

```bash
git add .claude/agents/shared-infra.md
git commit -m "feat: add Shared UI/Infra domain subagent"
```
