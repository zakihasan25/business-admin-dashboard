# Case study: a clearer operations workspace

## Context

This is independently designed portfolio work, not a client engagement. The fictional scenario is a growing operations business with 40 employees and 20 projects spread across five departments. Its representative challenges are scattered employee records, uncertain project ownership, and reporting that does not connect to day-to-day work.

## Approach

The interface prioritizes overview metrics, project visibility, and fast access to people. A restrained teal accent, consistent panels, compact tables, status labels, and responsive navigation support a calm business environment. Dark mode and keyboard-friendly dialogs make exploration more flexible.

## Implementation

Next.js statically exports a React application. Zod schemas define data and validate both forms and persisted browser records. Promise-based mock services isolate record changes from UI rendering. Shared state feeds tables, dashboard metrics, and department summaries so edits stay consistent. Recharts loads on demand. Financial date ranges have explicit sample-calendar semantics, and CSV generation runs in the browser.

## Interactive behavior

Visitors can create and edit fictional employees and projects, assign roles and departments, deactivate employees, change delivery status and progress, search/filter/sort/page records, review detail dialogs, export financial reports, mark notifications, select an access preview, and change preferences. Reset restores the original fixtures after confirmation. Corrupt local data safely falls back to fixtures.

## Tradeoffs

A single static route with client-side module navigation keeps deployment simple. Browser storage is appropriate for an isolated public demo, but does not support real collaboration, security, or reliable shared records. Role controls illustrate UI behavior only. Financial data is sample monthly reporting rather than project-generated accounting. The design uses custom UI and Radix dialogs instead of introducing an entire template or component framework.

## Validation

Unit tests cover derived metrics, mutations, validation, persistence recovery, and CSV escaping. Playwright exercises the critical demo journey and captures the implemented interface. Consult docs/VERIFICATION.md for the actual executed results. No client outcomes, conversion claims, or testimonials are asserted.

## Signature workflow: delivery-risk recovery

The strongest portfolio story is the consequence of a staffing decision. The planner compares remaining effort against capacity reserved for each project's date window. An employee's time is divided across overlapping scheduled assignments; inactive staff and paused/completed work do not add capacity. This prevents a common modeling error: giving the same person's full capacity to multiple projects.

Visitors compare a revised deadline or assignment transfer before changing records. A transfer can improve the target while making a source project riskier, and the interface exposes both effects. Applying a plan requires a rationale and a confirmation. The transaction updates all changed project records together and saves independent before/after snapshots in a browser-local journal. Undo validates those snapshots against current records and blocks when a later edit would be overwritten.

The initial fixtures provide a specific walkthrough: extend Customer portal redesign to October 30 and transfer Reese Vale from Partner onboarding. The selected project's estimated gap closes, while Partner onboarding loses capacity. These are reproducible sample calculations, not reported business outcomes.

The model explicitly excludes skills, holidays, leave, dependencies, automatic work completion, and uncertainty distributions. It is deterministic planning software with visible assumptions, not a trained prediction model. It demonstrates product reasoning and testable domain logic beyond conventional create/read/update/delete screens.
