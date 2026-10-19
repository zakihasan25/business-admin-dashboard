import { describe, it, expect } from 'vitest';
import { fixtures } from '../src/data/fixtures';
import { api, metrics, loadState, saveState, csv } from '../src/lib/mock-api';
describe('consistent demo services', () => {
  it('derives current totals from records', () => {
    const s = fixtures();
    expect(s.users).toHaveLength(40);
    expect(metrics(s)).toMatchObject({
      activeProjects: 15,
      activeEmployees: 36,
      completed: 5,
    });
    expect(
      s.projects.every((p) =>
        p.assignees.every((id) => s.users.some((u) => u.id === id)),
      ),
    ).toBe(true);
  });
  it('updates projects and dashboard totals together', async () => {
    const s = fixtures();
    const next = await api.saveProject(s, {
      ...s.projects[0],
      status: 'Completed',
      progress: 100,
    });
    expect(metrics(next).activeProjects).toBe(14);
    expect(metrics(next).pendingTasks).toBeLessThan(metrics(s).pendingTasks);
    expect(next.activities[0].text).toContain('Completed');
    expect(s.projects[0].status).toBe('Planning');
  });
  it('creates and updates employees and rejects duplicate emails', async () => {
    const s = fixtures();
    const next = await api.saveUser(s, {
      ...s.users[0],
      id: 'new-id',
      email: 'new@northstar.example',
      active: true,
    });
    expect(next.users).toHaveLength(41);
    expect(metrics(next).activeEmployees).toBe(37);
    const updated = await api.saveUser(next, {
      ...next.users[0],
      name: 'Sample Employee',
    });
    expect(updated.users[0].name).toBe('Sample Employee');
    await expect(
      api.saveUser(s, { ...s.users[0], id: 'duplicate' }),
    ).rejects.toThrow('already assigned');
  });
  it('rejects invalid project dates and unknown employees', async () => {
    const s = fixtures();
    await expect(
      api.saveProject(s, { ...s.projects[0], due: '2020-01-01' }),
    ).rejects.toThrow();
    await expect(
      api.saveProject(s, { ...s.projects[0], assignees: ['unknown'] }),
    ).rejects.toThrow();
  });
  it('validates persisted data and recovers corrupt storage', () => {
    expect(loadState({ getItem: () => '{broken' }).recovered).toBe(true);
    expect(loadState({ getItem: () => '{"version":99}' }).recovered).toBe(true);
    let raw = '';
    saveState(
      {
        setItem: (_, v) => {
          raw = v;
        },
      },
      fixtures(),
    );
    expect(loadState({ getItem: () => raw }).data.users).toHaveLength(40);
    expect(loadState({ getItem: () => null }).recovered).toBe(false);
  });
  it('escapes CSV cells and spreadsheet formulas', () => {
    expect(csv([['a"b', '=1+1']])).toBe('"a""b","\'=1+1"');
  });
});
