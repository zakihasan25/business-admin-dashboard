'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  userSchema,
  projectSchema,
  departments,
  roles,
  statuses,
  type User,
  type Project,
} from '@/lib/model';
export function UserForm({
  user,
  onSave,
}: {
  user: User;
  onSave: (u: User) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<User>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      ...user,
      capacityHoursPerDay: user.capacityHoursPerDay ?? 6,
    },
  });
  return (
    <form onSubmit={handleSubmit(onSave)} className="form-grid">
      <label>
        Full name
        <input {...register('name')} />
        <small>{errors.name?.message}</small>
      </label>
      <label>
        Email address
        <input {...register('email')} type="email" />
        <small>{errors.email?.message}</small>
      </label>
      <label>
        Department
        <select {...register('department')}>
          {departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </label>
      <label>
        Role
        <select {...register('role')}>
          {roles.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </label>
      <label>
        Daily project capacity (hours)
        <input
          type="number"
          min="0"
          max="8"
          step="0.5"
          {...register('capacityHoursPerDay', { valueAsNumber: true })}
        />
        <small>{errors.capacityHoursPerDay?.message}</small>
        <span className="muted">
          Planning budget, not working hours. Default 6h/day.
        </span>
      </label>
      <label className="check">
        <input type="checkbox" {...register('active')} /> Active employee
      </label>
      <button className="primary" disabled={isSubmitting}>
        Save employee
      </button>
    </form>
  );
}
export function ProjectForm({
  project,
  users,
  onSave,
}: {
  project: Project;
  users: User[];
  onSave: (p: Project) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Project>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      ...project,
      estimatedHours: project.estimatedHours ?? project.tasks * 4,
    },
  });
  return (
    <form onSubmit={handleSubmit(onSave)} className="form-grid">
      <label className="full">
        Project name
        <input {...register('name')} />
        <small>{errors.name?.message}</small>
      </label>
      <label>
        Department
        <select {...register('department')}>
          {departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </label>
      <label>
        Status
        <select {...register('status')}>
          {statuses.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </label>
      <label>
        Priority
        <select {...register('priority')}>
          {['High', 'Medium', 'Low'].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </label>
      <label>
        Progress (%)
        <input
          type="number"
          min="0"
          max="100"
          {...register('progress', { valueAsNumber: true })}
        />
        <small>{errors.progress?.message}</small>
      </label>
      <label>
        Start date
        <input type="date" {...register('start')} />
      </label>
      <label>
        Due date
        <input type="date" {...register('due')} />
        <small>{errors.due?.message}</small>
      </label>
      <label>
        Task count
        <input type="number" {...register('tasks', { valueAsNumber: true })} />
        <small>{errors.tasks?.message}</small>
      </label>
      <label>
        Assigned employees
        <select multiple {...register('assignees')}>
          {users.map((u) => (
            <option value={u.id} key={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <small>
          {errors.assignees?.message} Hold Ctrl / Cmd to select more.
        </small>
      </label>
      <label>
        Total estimated effort (hours)
        <input
          type="number"
          min="1"
          max="100000"
          {...register('estimatedHours', { valueAsNumber: true })}
        />
        <small>{errors.estimatedHours?.message}</small>
        <span className="muted">
          Total work before progress, across all assigned people.
        </span>
      </label>
      <button className="primary" disabled={isSubmitting}>
        Save project
      </button>
    </form>
  );
}
