import { fixtures } from '@/data/fixtures';
import {
  previewRecovery,
  recoveryScenarioSchema,
  type RecoveryScenario,
} from './delivery-risk';
import {
  stateSchema,
  userSchema,
  projectSchema,
  type DemoState,
  type User,
  type Project,
} from './model';
export const STORAGE_KEY = 'northstar-demo-v1';
export function loadState(storage: Pick<Storage, 'getItem'>): {
  data: DemoState;
  recovered: boolean;
} {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { data: fixtures(), recovered: false };
    return { data: stateSchema.parse(JSON.parse(raw)), recovered: false };
  } catch {
    return { data: fixtures(), recovered: true };
  }
}
export function saveState(storage: Pick<Storage, 'setItem'>, state: DemoState) {
  storage.setItem(STORAGE_KEY, JSON.stringify(stateSchema.parse(state)));
}
export function metrics(s: DemoState) {
  return {
    activeProjects: s.projects.filter((p) => p.status !== 'Completed').length,
    activeEmployees: s.users.filter((u) => u.active).length,
    pendingTasks: s.projects.reduce(
      (n, p) => n + Math.round(p.tasks * (1 - p.progress / 100)),
      0,
    ),
    completed: s.projects.filter((p) => p.status === 'Completed').length,
  };
}
function record(s: DemoState, text: string): DemoState {
  return {
    ...s,
    activities: [
      { id: crypto.randomUUID(), text, date: new Date().toISOString() },
      ...s.activities,
    ].slice(0, 100),
  };
}
export const api = {
  async applyRecovery(s: DemoState, input: RecoveryScenario) {
    const scenario = recoveryScenarioSchema.parse(input);
    const preview = previewRecovery(s, scenario);
    if (!preview.touched.length)
      throw new Error(
        'Change the deadline or staffing before applying a plan.',
      );
    const target = s.projects.find((p) => p.id === scenario.projectId)!;
    const plan = {
      id: crypto.randomUUID(),
      projectId: target.id,
      projectName: target.name,
      appliedAt: new Date().toISOString(),
      asOf: scenario.asOf,
      rationale: scenario.rationale,
      before: structuredClone(preview.touched),
      after: structuredClone(
        preview.projects.filter((p) =>
          preview.touched.some((t) => t.id === p.id),
        ),
      ),
      undone: false,
    };
    return record(
      {
        ...s,
        projects: preview.projects,
        recoveryPlans: [plan, ...(s.recoveryPlans ?? [])].slice(0, 50),
      },
      `Recovery plan applied: ${target.name}. ${scenario.rationale}`,
    );
  },
  async undoRecovery(s: DemoState, id: string) {
    const plan = s.recoveryPlans?.find((p) => p.id === id);
    if (!plan || plan.undone)
      throw new Error('This recovery plan is no longer available to undo.');
    if (
      plan.after.some(
        (saved) =>
          JSON.stringify(s.projects.find((p) => p.id === saved.id)) !==
          JSON.stringify(saved),
      )
    )
      throw new Error(
        'A project has changed since this plan was applied. Undo is blocked to protect newer edits.',
      );
    return record(
      {
        ...s,
        projects: s.projects.map((p) => {
          const old = plan.before.find((old) => old.id === p.id);
          return old ? structuredClone(old) : p;
        }),
        recoveryPlans: s.recoveryPlans?.map((p) =>
          p.id === id ? { ...p, undone: true } : p,
        ),
      },
      `Recovery plan undone: ${plan.projectName}`,
    );
  },
  async getUsers(s: DemoState) {
    return s.users;
  },
  async getProjects(s: DemoState) {
    return s.projects;
  },
  async getDashboardMetrics(s: DemoState) {
    return metrics(s);
  },
  async saveUser(s: DemoState, u: User) {
    const parsed = userSchema.parse(u);
    if (
      s.users.some(
        (v) => v.id !== u.id && v.email.toLowerCase() === u.email.toLowerCase(),
      )
    )
      throw new Error('This email is already assigned to a demo employee.');
    return record(
      {
        ...s,
        users: s.users.some((v) => v.id === u.id)
          ? s.users.map((v) => (v.id === u.id ? parsed : v))
          : [parsed, ...s.users],
      },
      `Employee record saved: ${u.name}`,
    );
  },
  async saveProject(s: DemoState, p: Project) {
    const parsed = projectSchema.parse(p);
    if (p.assignees.some((id) => !s.users.some((u) => u.id === id)))
      throw new Error('Choose an existing employee.');
    return record(
      {
        ...s,
        projects: s.projects.some((v) => v.id === p.id)
          ? s.projects.map((v) => (v.id === p.id ? parsed : v))
          : [parsed, ...s.projects],
      },
      `Project updated: ${p.name} · ${p.status}`,
    );
  },
};
export function csv(rows: (string | number)[][]) {
  return rows
    .map((row) =>
      row
        .map(
          (v) =>
            `"${String(v)
              .replace(/^[=+@\-]/, "'$&")
              .replaceAll('"', '""')}"`,
        )
        .join(','),
    )
    .join('\r\n');
}
