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
