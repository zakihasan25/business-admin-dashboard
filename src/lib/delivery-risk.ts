import { z } from 'zod';
import { projectSchema, type DemoState, type Project } from './model';

export const DEMO_AS_OF = '2026-10-19';
export const DEFAULT_DAILY_CAPACITY = 6;
const DAY = 86_400_000;
const dateNumber = (date: string) => Date.parse(`${date}T00:00:00Z`);
const dateString = (date: number) => new Date(date).toISOString().slice(0, 10);
const round = (n: number) => Math.round(n * 10) / 10;
export type RiskLevel =
  'At risk' | 'Tight' | 'On track' | 'Paused' | 'Complete';
export interface DeliveryEstimate {
  projectId: string;
  level: RiskLevel;
  remainingHours: number;
  capacityHours: number;
  gapHours: number;
  coverage: number | null;
  workingDays: number;
  activePeople: number;
  reasons: string[];
}
/** Counts Monday–Friday inclusive. Holidays and leave are deliberately not inferred. */
export function workingDays(from: string, to: string): number {
  const start = dateNumber(z.iso.date().parse(from));
  const end = dateNumber(z.iso.date().parse(to));
  if (end < start) return 0;
  const days = Math.floor((end - start) / DAY) + 1;
  let count = Math.floor(days / 7) * 5;
  for (let i = 0; i < days % 7; i++) {
    const weekday = new Date(start + i * DAY).getUTCDay();
    if (weekday !== 0 && weekday !== 6) count++;
  }
  return count;
}
const remaining = (p: Project) =>
  p.status === 'Completed'
    ? 0
    : round((p.estimatedHours ?? p.tasks * 4) * (1 - p.progress / 100));
const scheduled = (p: Project) =>
  p.status !== 'Completed' && p.status !== 'On Hold' && remaining(p) > 0;

/** Splits each person's daily capacity equally across overlapping scheduled assignments.
 * Boundary segments avoid iterating every calendar day, even for long project schedules.
 */
export function deliveryEstimates(
  state: DemoState,
  asOf = DEMO_AS_OF,
): DeliveryEstimate[] {
  z.iso.date().parse(asOf);
  return state.projects.map((p) => {
    const from = p.start > asOf ? p.start : asOf;
    const fromTime = dateNumber(from),
      until = dateNumber(p.due) + DAY;
    const people = state.users.filter(
      (u) => u.active && p.assignees.includes(u.id),
    );
    let capacity = 0;
    const shared = new Set<string>();
    if (scheduled(p) && fromTime < until) {
      for (const person of people) {
        const assignments = state.projects.filter(
          (other) =>
            scheduled(other) &&
            other.assignees.includes(person.id) &&
            other.due >= from &&
            other.start <= p.due,
        );
        const boundaries = new Set([fromTime, until]);
        for (const other of assignments) {
          const start = dateNumber(other.start > asOf ? other.start : asOf);
          const end = dateNumber(other.due) + DAY;
          if (start > fromTime && start < until) boundaries.add(start);
          if (end > fromTime && end < until) boundaries.add(end);
        }
        const points = [...boundaries].sort((a, b) => a - b);
        for (let i = 0; i < points.length - 1; i++) {
          const overlap = assignments.filter(
            (other) =>
              dateNumber(other.start) <= points[i] &&
              dateNumber(other.due) >= points[i],
          );

          const days = workingDays(
            dateString(points[i]),
            dateString(points[i + 1] - DAY),
          );
          if (overlap.length > 1 && days > 0) shared.add(person.name);
          capacity +=
            (days * (person.capacityHoursPerDay ?? DEFAULT_DAILY_CAPACITY)) /
            Math.max(1, overlap.length);
        }
      }
    }
    capacity = round(capacity);
    const hours = remaining(p);
    const coverage = hours > 0 ? capacity / hours : null;
    const level: RiskLevel =
      p.status === 'Completed'
        ? 'Complete'
        : p.status === 'On Hold'
          ? 'Paused'
          : hours === 0
            ? 'On track'
            : capacity < hours
              ? 'At risk'
              : capacity < hours * 1.15
                ? 'Tight'
                : 'On track';
    const reasons: string[] = [];
    if (p.status === 'Completed')
      reasons.push('Completed projects have no remaining demand.');
    else if (p.status === 'On Hold')
      reasons.push(
        'Paused work receives no capacity until its status changes.',
      );
    else {
      if (p.due < asOf && hours > 0)
        reasons.push('Deadline is before the analysis date.');
      if (hours === 0)
        reasons.push(
          'No estimated work remains; review whether the project can be closed.',
        );
      if (!people.length && hours > 0)
        reasons.push('No active employees are assigned.');
      if (people.some((u) => u.capacityHoursPerDay === 0))
        reasons.push('An assigned employee has zero daily project capacity.');
      if (shared.size)
        reasons.push(
          `${[...shared].join(', ')} ${shared.size === 1 ? 'shares' : 'share'} capacity with other scheduled projects.`,
        );
      if (hours > 0)
        reasons.push(
          capacity < hours
            ? `${round(hours - capacity)}h more work than available capacity.`
            : capacity < hours * 1.15
              ? 'Less than 15% capacity buffer remains.'
              : 'At least 15% capacity buffer is available.',
        );
    }
    return {
      projectId: p.id,
      level,
      remainingHours: hours,
      capacityHours: round(capacity),
      gapHours: round(Math.max(0, hours - capacity)),
      coverage: coverage === null ? null : round(coverage * 100),
      workingDays: workingDays(from, p.due),
      activePeople: people.length,
      reasons,
    };
  });
}
export const recoveryScenarioSchema = z.object({
  projectId: z.string().min(1),
  due: z.iso.date(),
  employeeId: z.string(),
  sourceProjectId: z.string(),
  asOf: z.iso.date(),
  rationale: z
    .string()
    .trim()
    .min(10, 'Explain the decision in at least 10 characters.')
    .max(500),
});
export type RecoveryScenario = z.infer<typeof recoveryScenarioSchema>;
export function previewRecovery(state: DemoState, input: RecoveryScenario) {
  const scenario = {
    ...recoveryScenarioSchema.omit({ rationale: true }).parse(input),
    rationale: input.rationale,
  };
  const target = state.projects.find((p) => p.id === scenario.projectId);
  if (!target || !scheduled(target))
    throw new Error(
      'Choose a scheduled project with remaining work. Paused projects must be resumed first.',
    );
  const person = state.users.find((u) => u.id === scenario.employeeId);
  if (
    scenario.employeeId &&
    (!person?.active || person.capacityHoursPerDay === 0)
  )
    throw new Error('Choose an active employee with available daily capacity.');
  if (scenario.sourceProjectId && !scenario.employeeId)
    throw new Error('Choose an employee before selecting a transfer.');
  let projects = state.projects.map((p) =>
    p.id === target.id
      ? projectSchema.parse({
          ...p,
          due: scenario.due,
          assignees: scenario.employeeId
            ? [...new Set([...p.assignees, scenario.employeeId])]
            : p.assignees,
        })
      : p,
  );
  if (scenario.sourceProjectId) {
    const source = projects.find((p) => p.id === scenario.sourceProjectId);
    if (
      !source ||
      source.id === target.id ||
      !scheduled(source) ||
      !source.assignees.includes(scenario.employeeId)
    )
      throw new Error('Choose an active source assignment to transfer from.');
    if (source.assignees.length < 2)
      throw new Error(
        'A transfer cannot leave another project without an assigned employee.',
      );
    projects = projects.map((p) =>
      p.id === source.id
        ? projectSchema.parse({
            ...p,
            assignees: p.assignees.filter((id) => id !== scenario.employeeId),
          })
        : p,
    );
  }
  const before = deliveryEstimates(state, scenario.asOf);
  const after = deliveryEstimates({ ...state, projects }, scenario.asOf);
  const touched = state.projects.filter(
    (p, i) => JSON.stringify(p) !== JSON.stringify(projects[i]),
  );
  const impacts = before.flatMap((estimate, i) =>
    Math.abs(estimate.capacityHours - after[i].capacityHours) >= 0.1 ||
    estimate.level !== after[i].level ||
    estimate.remainingHours !== after[i].remainingHours
      ? [{ projectId: estimate.projectId, before: estimate, after: after[i] }]
      : [],
  );
  return { projects, before, after, touched, impacts, scenario };
}
