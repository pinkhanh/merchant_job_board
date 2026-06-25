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
