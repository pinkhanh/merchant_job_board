# Domain-scoped Claude Code subagents — design

## Context

`CONTRIBUTING.md` and `.github/CODEOWNERS` already split the codebase into
4 ownership clusters to avoid merge conflicts among ~3-4 human members:

| Cluster | Owner | Scope |
|---|---|---|
| Job Post | `@member-A` | job CRUD/moderation/listing across all 3 sites |
| Application | `@member-B` | application/apply flow across all 3 sites |
| Merchant identity / Store | `@member-C` | merchant mgmt, profile, store, AI description |
| Shared UI / Infra | `@member-D` | prisma, auth, db, globals.css, Shell/middleware (built first, as the base layer) |

Section 5 of `CONTRIBUTING.md` already describes running a Claude Code agent
per task inside its own git worktree, scoped to one cluster, committing
locally without pushing, then having the cluster owner review the diff
before pushing/opening a PR.

This design adds one persistent subagent definition per cluster so that
workflow doesn't require re-explaining each cluster's scope, hot files, and
test commands every time.

## Goal

Add 4 subagent config files under `.claude/agents/`, one per cluster, so
that dispatching work to "the Job Post agent" (etc.) carries the cluster's
file scope, hot-file warnings, and relevant test paths without the user
re-typing them.

## Non-goals

- Not changing CODEOWNERS, CONTRIBUTING.md, or the cluster boundaries.
- Not automating worktree creation or PR flow — that's already covered by
  `CONTRIBUTING.md` section 5 and the `using-git-worktrees` skill.
- Not filling in real GitHub usernames in CODEOWNERS (separate, deferred task).

## Design

4 files, one per cluster, named after the cluster:

- `.claude/agents/job-post.md`
- `.claude/agents/application.md`
- `.claude/agents/merchant-identity.md`
- `.claude/agents/shared-infra.md`

Each file uses Claude Code's subagent frontmatter format:

```markdown
---
name: <cluster-slug>
description: Use for tasks scoped to the <Cluster Name> domain — <one-line scope summary>. <trigger examples>
---

<body>
```

Body content per agent, derived directly from `CODEOWNERS`/`CONTRIBUTING.md`
(no new scope decisions, just restructured into per-agent instructions):

1. **Owned paths** — the exact path list from that cluster's `CODEOWNERS`
   section (services, app routes, components, tests).
2. **Hot files** — any paths from `CONTRIBUTING.md` section 3 that intersect
   this cluster's owned services (e.g. Job Post agent's body flags
   `lib/services/jobPostService.ts` as shared with worker-listing tasks
   within the same cluster).
3. **Test command** — the cluster's test paths from `CODEOWNERS`, run via
   `npx vitest run <paths>` before considering work done.
4. **Boundary rule** — one explicit instruction: if a task requires touching
   a file outside the owned-paths list, stop and report back instead of
   editing it. This is the actual conflict-avoidance mechanism — it keeps an
   agent inside its cluster even if a task description drifts.

The `shared-infra` agent additionally notes it's the foundation layer per
`CONTRIBUTING.md` section 4 (built/merged first; other 3 clusters depend on
it being stable before running in parallel).

No tools/model restriction in frontmatter — each agent needs full
read/write/test capability to do real implementation work in its worktree.

## Testing

Not applicable in the traditional sense — these are prompt/config files, not
code. Validation is: each file parses as valid subagent frontmatter (name +
description present) and the owned-path lists match `CODEOWNERS` exactly
(spot-check by diffing against the CODEOWNERS sections during review).
