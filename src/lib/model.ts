import { z } from 'zod';
export const departments = [
  'Operations',
  'Engineering',
  'Design',
  'Marketing',
  'Finance',
] as const;
export const roles = [
  'Administrator',
  'Manager',
  'Team Member',
  'Viewer',
] as const;
export const statuses = [
  'Planning',
  'In Progress',
  'On Hold',
  'Completed',
] as const;
export const userSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(2).max(80),
  email: z.email().max(120),
  department: z.enum(departments),
  role: z.enum(roles),
  active: z.boolean(),
  capacityHoursPerDay: z.number().min(0).max(8).optional(),
});
export const projectSchema = z
  .object({
    id: z.string(),
    name: z.string().trim().min(3).max(100),
    department: z.enum(departments),
    status: z.enum(statuses),
    priority: z.enum(['High', 'Medium', 'Low']),
    start: z.iso.date(),
    due: z.iso.date(),
    progress: z.number().min(0).max(100),
    assignees: z.array(z.string()).min(1),
    tasks: z.number().int().min(1).max(1000),
    estimatedHours: z.number().min(1).max(100000).optional(),
  })
  .refine((p) => p.due >= p.start, {
    message: 'Due date must follow start date',
    path: ['due'],
  });
export type User = z.infer<typeof userSchema>;
export type Project = z.infer<typeof projectSchema>;
export const stateSchema = z.object({
  version: z.literal(1),
  users: z.array(userSchema),
  projects: z.array(projectSchema),
  financials: z.array(
    z.object({ month: z.string(), revenue: z.number(), cost: z.number() }),
  ),
  activities: z.array(
    z.object({ id: z.string(), text: z.string(), date: z.string() }),
  ),
  notifications: z.array(
    z.object({ id: z.string(), text: z.string(), read: z.boolean() }),
  ),
  recoveryPlans: z
    .array(
      z.object({
        id: z.string(),
        projectId: z.string(),
        projectName: z.string(),
        appliedAt: z.string(),
        asOf: z.iso.date(),
        rationale: z.string(),
        before: z.array(projectSchema),
        after: z.array(projectSchema),
        undone: z.boolean(),
      }),
    )
    .max(50)
    .optional(),
  settings: z.object({
    organization: z.string().min(2).max(80),
    theme: z.enum(['light', 'dark']),
    pageSize: z.number().int().min(5).max(20),
  }),
});
export type DemoState = z.infer<typeof stateSchema>;
