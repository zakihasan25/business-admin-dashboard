# Frontend architecture

## Rendering and navigation

Next.js App Router statically exports the root page with `output: export`. The interactive workspace is a client component. Its nine modules share a shell and use client state with a readable hash for reload continuity. There are no runtime API routes, Server Actions, middleware, sessions on a server, or dynamic server rendering. Radix dialog primitives provide focus trapping, Escape dismissal, accessible titles, and focus restoration.

## Data model

Zod defines User, Project, and the versioned DemoState. Typed enums define departments, roles, and project statuses. State contains financial records, activities, notifications, and settings. Fixtures live separately and generate 40 employees, 20 projects, and 12 monthly financial entries. Project assignees refer to user IDs. Models validate dates, email shape, progress ranges, and required assignments.

## Data flow

Fixtures → validated browser storage load → shared workspace state → derived metrics and module views. Forms validate through React Hook Form and Zod. Promise-based mock services validate record changes and return new state plus activity events. The workspace commits returned state to memory and localStorage. User email duplicates and unknown employee assignments are rejected. Views rerender from the updated shared state.

Pending tasks sum the unfinished share of each project’s task count. Completion and active project counts derive from status. Workload groups noncompleted projects by department. Financial filters slice fixed 2026 monthly sample records; project and team metrics remain current snapshots across all dates. CSV exports exactly the selected financial period, quoting cells and guarding leading formula characters.

## Persistence and recovery

`northstar-demo-v1` stores versioned JSON. Loading parses the full schema; malformed content returns fresh fixtures with a visible recovery notice. Writes validate again and catch quota or unavailable storage failures. Reset requires confirmation and replaces the full state. Demo entry uses sessionStorage independently of local records. No credentials exist. Multi-tab synchronization and storage migration beyond version 1 are not implemented.

## Access preview

Administrator and Manager previews enable employee/project editing. Administrator alone can change organization information. Team Member and Viewer previews browse records. Personal display settings and reset remain available. These are illustrative UI controls, not authorization enforcement; users can inspect and modify browser state.

## Performance and verification

Charts are lazy-loaded, fixtures are small, and table rendering is paginated. Tailwind and a shared token-based stylesheet provide responsive light/dark layouts. Unit tests target calculations and service invariants. Playwright drives the static production export and saves actual desktop/mobile screenshots. Exact executed checks are recorded in docs/VERIFICATION.md.

## Production extension

A real product would need server-side validation and authorization, audited API endpoints, a database, pagination/search on the server, concurrency control, and secure identity integration. Those are outside this demonstration and are not implemented.

## Delivery planning and recovery transactions

`src/lib/delivery-risk.ts` is a pure calculation engine. It computes remaining effort from total estimated hours and progress, then divides each active employee's daily project capacity equally across overlapping scheduled assignments. UTC date boundaries and inclusive weekday counts avoid local-time and daylight-saving errors. Boundary segments keep calculations bounded by assignment count rather than iterating every day of long schedules.

The default analysis date is October 19, 2026, matching the fictional calendar. It can be changed within the planner. The default estimate is four hours per task for older records; daily project capacity defaults to six hours. Optional schema fields preserve compatibility with existing version-1 saved data, with no destructive reset or new dependencies.

`previewRecovery` returns a proposed state, changed records, and before/after estimates for all projects without writing anything. `api.applyRecovery` validates the rationale, applies changed project records in one state update, and stores cloned snapshots in `recoveryPlans`. Up to 50 decisions are retained. `api.undoRecovery` compares affected records against the saved after-snapshots, then restores before-snapshots only if no newer project edit would be lost. The browser journal is not a secure audit log and multi-tab writes remain uncoordinated.

The dedicated, lazy-loaded planner UI lives in `src/features/recovery-planner.tsx`. Employee and project forms expose capacity and estimated effort. The overview risk count reads the same calculation engine. Scenario controls remain available in a read-only role preview, while applying and undoing require a simulated editing role.
