import { describe, expect, it } from 'vitest';
import { fixtures } from '../src/data/fixtures';
import {
  workingDays,
  deliveryEstimates,
  previewRecovery,
  type RecoveryScenario,
} from '../src/lib/delivery-risk';
import { api, loadState, saveState } from '../src/lib/mock-api';
import type { DemoState } from '../src/lib/model';
function sample(): DemoState {
  const s = fixtures();
  s.users = s.users
    .slice(0, 2)
    .map((u) => ({ ...u, active: true, capacityHoursPerDay: 6 }));
  s.projects = s.projects.slice(0, 2).map((p, i) => ({
    ...p,
    status: 'In Progress',
    progress: 0,
    start: '2026-10-19',
    due: '2026-10-20',
    estimatedHours: i === 0 ? 10 : 16,
    assignees: i === 0 ? [s.users[0].id] : s.users.map((u) => u.id),
  }));
  return s;
}
function transfer(s: DemoState): RecoveryScenario {
  return {
    projectId: s.projects[0].id,
    due: s.projects[0].due,
    employeeId: s.users[0].id,
    sourceProjectId: s.projects[1].id,
    asOf: '2026-10-19',
    rationale:
      'Protect the higher-priority delivery while reviewing the source deadline.',
  };
}
describe('explainable delivery planning', () => {
  it('counts inclusive weekdays across weekends and reversed ranges', () => {
    expect(workingDays('2026-10-23', '2026-10-26')).toBe(2);
    expect(workingDays('2026-10-24', '2026-10-25')).toBe(0);
    expect(workingDays('2026-10-20', '2026-10-19')).toBe(0);
    expect(workingDays('2026-10-19', '2026-11-01')).toBe(10);
  });
  it('conserves capacity across overlapping assignments and explains risk', () => {
    const result = deliveryEstimates(sample());
    expect(result[0]).toMatchObject({
      capacityHours: 6,
      remainingHours: 10,
      gapHours: 4,
      level: 'At risk',
    });
    expect(result[1]).toMatchObject({ capacityHours: 18, level: 'Tight' });
    expect(result.reduce((n, e) => n + e.capacityHours, 0)).toBe(24);
    expect(result[0].reasons.join(' ')).toContain('shares capacity');
  });
  it('previews a beneficial transfer and the cost to the source without mutation', () => {
    const s = sample();
    const original = JSON.stringify(s);
    const p = previewRecovery(s, transfer(s));
    expect(p.after[0]).toMatchObject({ capacityHours: 12, level: 'On track' });
    expect(p.after[1]).toMatchObject({ capacityHours: 12, level: 'At risk' });
    expect(p.touched).toHaveLength(1);
    expect(p.impacts).toHaveLength(2);
    expect(JSON.stringify(s)).toBe(original);
  });
  it('models starts, paused work, inactive staff, zero capacity and overdue work', () => {
    const s = sample();
    s.projects[1].status = 'On Hold';
    expect(deliveryEstimates(s)[0].capacityHours).toBe(12);
    expect(deliveryEstimates(s)[1].level).toBe('Paused');
    s.users[0].active = false;
    expect(deliveryEstimates(s)[0].capacityHours).toBe(0);
    s.users[0].active = true;
    s.users[0].capacityHoursPerDay = 0;
    expect(deliveryEstimates(s)[0].capacityHours).toBe(0);
    s.users[0].capacityHoursPerDay = 6;
    s.projects[0].start = '2026-10-20';
    expect(deliveryEstimates(s)[0].capacityHours).toBe(6);
    expect(deliveryEstimates(s, '2026-10-21')[0].workingDays).toBe(0);
    s.projects[0].status = 'Completed';
    expect(deliveryEstimates(s)[0].remainingHours).toBe(0);
  });
  it('deadline extensions expose downstream capacity losses on future assignments', () => {
    const s = sample();
    s.projects.push({
      ...s.projects[0],
      id: 'future',
      start: '2026-10-21',
      due: '2026-10-22',
    });
    const p = previewRecovery(s, {
      ...transfer(s),
      sourceProjectId: '',
      employeeId: '',
      due: '2026-10-22',
    });
    expect(
      p.impacts.find((i) => i.projectId === 'future')?.after.capacityHours,
    ).toBe(6);
    expect(
      p.impacts.find((i) => i.projectId === 'future')?.before.capacityHours,
    ).toBe(12);
  });
  it('applies an atomic plan, persists the journal and restores it on undo', async () => {
    const s = sample();
    const next = await api.applyRecovery(s, transfer(s));
    expect(next.projects[1].assignees).toEqual([s.users[1].id]);
    expect(next.recoveryPlans?.[0].rationale).toContain('higher-priority');
    expect(next.activities[0].text).toContain('Recovery plan applied');
    let raw = '';
    saveState(
      {
        setItem: (_, value) => {
          raw = value;
        },
      },
      next,
    );
    const loaded = loadState({ getItem: () => raw });
    expect(loaded.recovered).toBe(false);
    const restored = await api.undoRecovery(
      loaded.data,
      next.recoveryPlans![0].id,
    );
    expect(restored.projects).toEqual(s.projects);
    expect(restored.recoveryPlans?.[0].undone).toBe(true);
    await expect(
      api.undoRecovery(restored, next.recoveryPlans![0].id),
    ).rejects.toThrow('no longer available');
  });
  it('protects newer project edits from undo', async () => {
    const s = sample();
    const next = await api.applyRecovery(s, transfer(s));
    next.projects[1].name = 'Newer manual edit';
    await expect(
      api.undoRecovery(next, next.recoveryPlans![0].id),
    ).rejects.toThrow('newer edits');
  });
  it('rejects invalid scenarios, missing rationale, no changes and last-assignee transfers', async () => {
    const s = sample();
    await expect(
      api.applyRecovery(s, { ...transfer(s), rationale: 'short' }),
    ).rejects.toThrow();
    expect(() =>
      previewRecovery(s, { ...transfer(s), due: '2026-01-01' }),
    ).toThrow();
    s.projects[1].assignees = [s.users[0].id];
    expect(() => previewRecovery(s, transfer(s))).toThrow(
      'without an assigned',
    );
    await expect(
      api.applyRecovery(s, {
        ...transfer(s),
        sourceProjectId: '',
        employeeId: '',
      }),
    ).rejects.toThrow('Change the deadline');
    expect(() =>
      previewRecovery(s, { ...transfer(s), employeeId: 'unknown' }),
    ).toThrow('active employee');
  });
  it('supports older saved records without effort, capacity or decision history', () => {
    const s = sample();
    delete s.projects[0].estimatedHours;
    delete s.users[0].capacityHoursPerDay;
    expect(deliveryEstimates(s)[0].remainingHours).toBe(
      s.projects[0].tasks * 4,
    );
    expect(loadState({ getItem: () => JSON.stringify(s) }).recovered).toBe(
      false,
    );
  });
});
