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
