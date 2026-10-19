# Delivery planner: portfolio feature brief

## Positioning

**Preview the cost of recovering a project before committing to a staffing decision.**

The distinguishing behavior is the downstream consequence, not the number of dashboard screens. A manager can close one project's capacity gap while seeing the capacity lost by other work, explain the decision, and reverse it without overwriting newer edits.

## Reproduce the signature demo

1. Reset demo data if you have edited the fictional records.
2. Open Delivery planner. The analysis date is October 19, 2026.
3. Customer portal redesign is selected by default. It has 43.2h of estimated work left and 6h of allocated capacity.
4. Click Load example. It extends the deadline to October 30 and removes Reese Vale's assignment from Partner onboarding while keeping Reese on the portal.
5. The portal gains capacity to 60h and closes its gap. Partner onboarding falls from 54h to 30h and becomes at risk. Both effects are calculated from the same records.
6. Change the scenario or enter a rationale and choose Review & apply plan. Confirmation shows the downstream effects.
7. Applied changes persist across reloads. Decision history retains the rationale and snapshots. Undo restores changed records if they remain unchanged; later edits produce a visible conflict message instead of being overwritten.

These numbers describe the original fictional fixtures and displayed assumptions, not a client result.

## Assumptions and limits

- Remaining effort = total estimated hours × unfinished percentage.
- Weekdays are Monday–Friday, including the analysis/start and due dates when they are weekdays.
- Active staff receive an editable 0–8h daily project budget, default 6h.
- A person's budget is split equally across overlapping scheduled assignments.
- Paused and completed projects receive no capacity; inactive staff contribute none.
- Capacity is reserved through the due date; work does not automatically finish early in the model.
- At risk means insufficient estimated capacity. Tight means less than 15% buffer. On track means at least 15% buffer or no remaining effort.
- No holidays, leave, skills, dependencies, uncertainty distributions, or overtime. This is an explainable estimate, not validated forecasting, a burnout diagnosis, or a secure audit system.
- Transfers cannot remove the only assigned employee from a source project.
- All effects are local to this browser. No backend, AI API, or production access enforcement.

## Current-world relevance and a future extension

Microsoft's May 2026 Work Trend Index discusses keeping human judgment central as organizations adopt agents. The planner's preview → rationale → review → apply workflow is a product-design response to that theme; the research does not validate this planner or imply endorsement. [Microsoft 2026 report](https://www.microsoft.com/en-us/worklab/work-trend-index/agents-human-agency-and-the-opportunity-for-every-organization)

A strong next feature would be **skills-aware staffing with an explainable match**: show whether a person has the required skills as well as capacity, and what skill gaps would require training or review. The World Economic Forum's 2025 report identifies skill gaps as a major barrier for surveyed employers. That supports the relevance of the problem, not a claim that this proposed feature has already been implemented. [WEF Future of Jobs 2025](https://www.weforum.org/publications/the-future-of-jobs-report-2025/)

Keep skill matching as a separate scoped enhancement. Do not advertise AI, skills inference, or automated staff scoring in the current application.
