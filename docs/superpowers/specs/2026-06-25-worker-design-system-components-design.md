# Worker site: Mobase-based design system component library

## Context

The user exported 25 PNGs (2x) from the MoMo "Mobase" Figma design system
(`MoMo Web design system (Copy)`, originally `MoMo-Web-design-system`) to
`C:\Users\jasmi\Downloads\MoMo Web design system (Copy)`. Several files are
misnamed relative to their actual content (export mistake, not a naming
convention):

| Exported filename | Actual component |
|---|---|
| `Checkbox-1.png` | Spinner |
| `Document.png` | Button |
| `Document-1.png` | IconButton |
| `Document-2.png` | Calendar |
| `Document-3.png` | Date Picker / Date Range Picker |
| `Document-4.png` | Alert Dialog |
| `Document-5.png` | Tabs |
| `Notification-1.png` | Callout |
| `Radio Button-1.png` | Choicebox |
| `Form Input-3.png` / `Form Input-4.png` | duplicates, both "Command (Search)" |

No Figma MCP access is available for this file (rate-limited / file outside
the user's plan — see prior conversation), so component specs below are
read visually off the PNGs, not extracted as exact px/hex values. Colors are
mapped to the closest existing `--color-worker-*` token; a few new tokens are
added where no existing worker token covers the semantic (warning/info).
Exact values may need adjustment once Figma Dev Mode access is available —
this is a known, accepted limitation of this approach (confirmed with user).

This design system is **worker-site only** (`app/jobs/**`,
`components/WorkerHeader.tsx`, `components/ApplyModal.tsx`). It must not
change anything under `app/admin/**`, `app/merchant/**`, or `Shell.tsx`.

Icons: already solved separately — `@heroicons/react` is installed and used
project-wide (not worker-specific). Use it for any icon needed inside these
components (chevrons, check, x, exclamation-circle, etc.) rather than new SVGs.

## Goals

1. Add the small set of missing worker design tokens (warning/info status
   colors) needed by Notification/Callout.
2. Build a `components/worker/ui/` library of 22 components matching the
   Mobase export, each typed, accessible, and styled with existing
   `--color-worker-*` / `--radius-worker-*` / `--shadow-worker-*` tokens.
3. Replace the 6 raw, hand-rolled equivalents already live on the worker site
   with the new components (no behavior change, just componentization):
   Chips (employment-type filter), Select (salary/industry filter), Avatar
   (merchant logos), Show more ("Tải thêm"), Spinner (new — jobs list has no
   loading state today), Notification/Callout (ApplyModal success/error).
4. The remaining 16 components are built standalone (exported, tested) but
   not wired into any page yet — no current worker screen needs them.

## Token additions (`app/globals.css`, worker `@theme` block)

Following the existing `--color-status-*-bg/-text` pattern used by the
admin/merchant tokens, add the two missing semantic pairs for worker:

```css
--color-worker-warning-bg: #FFF4E0;
--color-worker-warning-text: #B25E00;
--color-worker-info-bg: #E8F0FE;
--color-worker-info-text: #1A56DB;
--color-worker-success-bg: #E3F9E9;
--color-worker-error-bg: #FDE8E8;
```

`--color-worker-success` and `--color-worker-danger` already exist (used as
the *text/icon* color); the new `-bg` variants give Notification/Callout a
tinted background to match the Figma reference.

## Component library (`components/worker/ui/`)

One file per component, named to match Figma, default export the component,
barrel-exported from `components/worker/ui/index.ts`. All are client
components only where they need interactivity (state, handlers); purely
presentational ones (Avatar, Heading, ProgressBar) have no `'use client'`.

**Wired into existing worker pages (do this after the component exists):**

1. **Spinner** — dot-bounce + spin variants (gray default / pink active per
   reference). Used as: `app/jobs/page.tsx` shows it in place of the job
   list while the initial `load(1, false)` fetch is in flight.
2. **Chips** — `variant: primary | outline | secondary`, `size: sm | md`,
   selected/unselected state, optional leading `+`/count. Replaces the
   employment-type filter buttons in `app/jobs/page.tsx`.
3. **Select** — wraps a native `<select>` styled per reference (label,
   placeholder, focus/error/disabled visual states via props, not literal
   unless needed). Replaces the two `<select>` filters in `app/jobs/page.tsx`.
4. **Avatar** — `variant: text | person | image`, `shape: circle | square`,
   `size: 24 | 32 | 40 | 48 | 56 | 72`. Replaces the merchant-logo circles in
   `app/jobs/page.tsx` and `app/jobs/[id]/page.tsx`.
5. **ShowMore** — link-style expand/collapse button (`Xem thêm` / `Thu gọn`).
   Replaces the "Tải thêm" button in `app/jobs/page.tsx` (label stays "Tải
   thêm" — only the underlying component changes, not the copy).
6. **Notification** (toast: success/warning/error, optional title + text
   link, dismiss `x`) and **Callout** (inline banner: neutral/error/success/
   warning/info, optional action link, disabled state) — `ApplyModal.tsx`'s
   hand-rolled success state (`CheckCircleIcon` + text) becomes a
   `<Notification variant="success">`; form-level errors become a `<Callout
   variant="error">` instead of the current raw `<p role="alert">`.

**Standalone for now (built + tested, not wired anywhere):**

7. **Button** — `variant: primary | secondary | outline | tonal | danger |
   transparent`, optional leading icon, loading state (spinner replaces
   label), `as` link mode.
8. **IconButton** — same variant set as Button, icon-only, no text label.
9. **Breadcrumb** — ordered list of `{ label, href? }`, home icon first item,
   current (last) item not a link.
10. **Tabs** — controlled `value`/`onChange`, underline-active style,
    supports nested option groups (per reference's "Opt 1/Opt 2" grouping) —
    implement as a flat tab list grouped visually by an optional `group`
    field per tab, since worker site has no actual nested-tab use case to
    validate against.
11. **Checkbox** — `size: medium | large`, checked/unchecked/disabled.
12. **RadioButton** — `size: medium | large`, default/checked/disabled,
    grouped via standard `name` prop.
13. **SwitchToggle** — on/off, disabled.
14. **Choicebox** — larger card-style single/multi select (`mode: single |
    multi`), supports custom children (logo/icon + label, per reference's
    "Custom content" row) instead of a fixed icon+title+subtitle shape.
15. **ProgressBar** — `size: sm | md | lg`, `status: progress | success |
    disabled`, optional empty state.
16. **TextInput** — label, placeholder, help text, error text, focused/
    filled/disabled/error visual states (driven by `error`/`disabled` props
    plus native focus, not literal "hover" props).
17. **TextArea** — same prop shape as TextInput, multiline.
18. **SearchBar** — leading magnifier icon, trailing clear `x` (shown only
    when there's a value), disabled state.
19. **MultiSelect** — tag-style selected values inside the control (per
    "Multiple Selector" reference), dropdown list below.
20. **CommandSearch** — search input + filtered list with a checkmark on the
    selected item (`cmdk`-style). No new dependency — implement as a plain
    controlled filter-as-you-type list, not a wrapper around an actual
    `cmdk` package, since the reference shows only the visual, not behavior
    requiring virtualization/keyboard nav beyond basic up/down/enter.
21. **Calendar** — month grid, supports the 4 documented modes (plain day /
    day+lunar / day+price / day+lunar+price) via a `mode` prop, prev/next
    month navigation.
22. **DatePicker** / **DateRangePicker** — text input (`Chọn ngày`) + popover
    `Calendar`; range variant shows two months side-by-side with start/end
    highighting.
23. **AlertDialog** — modal with title, body, cancel + confirm actions,
    overlay backdrop (matches the existing `ApplyModal` overlay pattern).
24. **Heading** — not a real interactive component; the reference is a
    typography sample (page title + colored sub-heading variants). Implement
    as a small set of exported Tailwind class strings (e.g.
    `headingStyles.page`, `headingStyles.sub`) rather than a wrapper
    component, since there's no shared structural markup to componentize.

## Out of scope

- Exact pixel/hex fidelity — this is a best-visual-match pass off PNG
  exports, not Figma Dev Mode data. Revisit once Figma access is fixed.
- Wiring components 7–23 into any page — no current worker screen needs
  them; they ship as a library for future worker features.
- Any change to `app/admin/**`, `app/merchant/**`, or `Shell.tsx`.
- Storybook or any other component-explorer tooling — not present in this
  project today, not worth introducing for this.

## Testing

- Vitest + React Testing Library, one test file per component under
  `tests/components/worker/ui/`, covering: renders with required props,
  each documented variant/size renders without throwing, interactive
  components (Checkbox, RadioButton, SwitchToggle, Tabs, Chips, Select,
  MultiSelect, Choicebox, CommandSearch, Calendar/DatePicker, AlertDialog)
  fire their change/select/close callbacks correctly, disabled state blocks
  interaction.
- After wiring components 1–6 into `app/jobs/page.tsx`, `app/jobs/[id]/page.tsx`,
  `ApplyModal.tsx`: run the full existing test suite for those files and fix
  any selector breakage (e.g. tests querying the old raw `<select>` markup).
- Manually run the dev server and check `/jobs` and `/jobs/[id]` render
  correctly with no visual regression from the componentization.
