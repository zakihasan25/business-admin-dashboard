# Verification record

Executed locally on October 19, 2026, against the implemented application.

| Check               | Result                                                        |
| ------------------- | ------------------------------------------------------------- |
| `npm run typecheck` | Passed; strict TypeScript                                     |
| `npm run lint`      | Passed; zero errors and warnings                              |
| `npm test`          | Passed; 15 unit tests                                         |
| `npm run build`     | Passed; static root and not-found pages generated into `out/` |
| `npm run test:e2e`  | Passed; 5 Chromium end-to-end tests                           |

The browser suite uses a dedicated production static preview on port 4173, independently of any development server. Unit and browser tests needed execution outside the managed Windows sandbox because Vite cache renames and browser child processes require permissions unavailable inside that sandbox.

## Coverage

- Demo entry, exit, re-entry, and fresh-browser initialization.
- All nine modules.
- Employee search and department filters, creation, editing, and persistence after reload.
- Project completion and corresponding dashboard metric changes.
- Financial date filtering and browser CSV download.
- Viewer permission preview disables editing; Administrator restores it.
- Notification read state, theme changes, and confirmed full reset.
- Corrupt localStorage recovery.
- Mobile navigation and no page-level horizontal overflow.
- All modules at 390px phone and 768px tablet widths.
- Collapsed sidebar navigation, Escape dismissal, and dialog focus restoration.
- No uncaught browser page errors in the main desktop journey.

Six unit tests cover fixture relationships and totals, project mutations and task calculations, user creation/editing and duplicate email rejection, project validation, persisted-state validation/recovery, and CSV quoting/formula escaping.

## Delivery recovery verification

Nine additional unit tests exercise inclusive weekday counting; shared-capacity conservation; downstream transfer tradeoffs without mutation; future start dates, inactive and zero-capacity staff, paused/completed/overdue work; deadline extensions affecting future assignments; atomic application and persisted history; independent snapshots; undo conflict protection; invalid scenarios and single-assignee transfer guards; and compatibility with older saved records.

Two additional browser tests cover the guided Load example scenario, a closing target gap with a source-project capacity loss, absence of writes during preview, confirmation, multi-project application, reload persistence, successful undo, blocked undo after a newer edit, disabled apply/undo for Viewer, mobile overflow checks, dark mode, changing the analysis date, and an all-completed workload empty state. The full five-test suite passed against the static export. Main desktop and recovery journeys recorded no uncaught page errors.

Scenario screenshots deliberately contain an unapplied fictional draft. Captures blur the active field and scroll to the top so fixed navigation renders in its proper position.

## Visual review

Twelve actual Playwright screenshots are saved under `docs/portfolio/screenshots/`: demo entry, overview, employees, projects, analytics, light settings, dark settings, mobile overview, mobile projects, delivery recovery scenario, mobile delivery planner, and dark delivery planner. Desktop viewport is 1440 × 1080; phone viewport is 390 × 844. Full-page images can be taller than the viewport. Main desktop captures are refreshed after reset so they show original records. No developer overlays are included.

Visual review identified and corrected mobile document overflow caused by an absolutely positioned hidden table label, incomplete chart animation in captures, and missing dialog focus return. Tables deliberately scroll horizontally within their containers on small screens. The capture process dismisses transient messages for the final clean desktop set.

## Installed versions

Next.js 16.4.2; React/React DOM 19.3.1; TypeScript 6.0.3; Tailwind CSS 4.3.3; Recharts 3.10.1; React Hook Form 7.90.0; Zod 4.6.7; resolver 5.9.2; Radix Dialog 1.3.1; Lucide 1.59.0; ESLint 10.13.0; Prettier 3.9.10; Vitest 4.1.12; Playwright 1.64.1. The lockfile determines reproducible installation.

Resolver 6 initially had an incompatible optional peer dependency tree; version 5 is compatible with this app. No force-install workaround was used for application dependencies.

## Dependency advisory limitation

`npm audit` reported five high-severity development-tool findings in the chain `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`. The underlying advisory is [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). The currently published braces release is 3.0.3 and the advisory includes that release. The audit suggestion downgrades the Next lint configuration to an older major version; it was not applied because that would compromise compatibility. These packages support local linting and are not part of the deployed static website. Recheck advisories and update when a compatible patch is released. A separate preview-server compression advisory was removed by replacing that dependency with the small local static server.

Automated accessibility coverage is limited to semantic controls, keyboard interactions, focus, and responsive layout checks. No claim of a formal WCAG audit, all-browser coverage, or production security review is made. No deployment, GitHub push, or external account modification was performed.
