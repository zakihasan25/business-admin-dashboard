'use client';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  GitCompareArrows,
  ShieldCheck,
  Undo2,
  TriangleAlert,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { z } from 'zod';
import type { DemoState, Project } from '@/lib/model';
import {
  deliveryEstimates,
  previewRecovery,
  DEMO_AS_OF,
  type RecoveryScenario,
  type DeliveryEstimate,
} from '@/lib/delivery-risk';
import { api } from '@/lib/mock-api';
import { Modal } from '@/components/ui/modal';

function RiskBadge({ estimate }: { estimate: DeliveryEstimate }) {
  return (
    <span
      className={`risk-badge risk-${estimate.level.toLowerCase().replaceAll(' ', '-')}`}
    >
      <span />
      {estimate.level}
    </span>
  );
}
function errorMessage(error: unknown) {
  return error instanceof z.ZodError
    ? error.issues[0].message
    : error instanceof Error
      ? error.message
      : 'Unable to calculate this scenario.';
}
export function RecoveryPlanner({
  state,
  canEdit,
  onCommit,
  onProjects,
}: {
  state: DemoState;
  canEdit: boolean;
  onCommit: (s: DemoState, message: string) => void;
  onProjects: () => void;
}) {
  const [asOf, setAsOf] = useState(DEMO_AS_OF),
    [selectedId, setSelectedId] = useState(''),
    [undoId, setUndoId] = useState(''),
    [error, setError] = useState('');
  const estimates = useMemo(
    () => deliveryEstimates(state, asOf),
    [state, asOf],
  );
  const scheduled = state.projects.filter(
    (p) =>
      p.status !== 'Completed' && p.status !== 'On Hold' && p.progress < 100,
  );
  const selected = scheduled.find((p) => p.id === selectedId) ?? scheduled[0];
  const ranked = [...estimates]
    .filter((e) => e.level !== 'Complete')
    .sort(
      (a, b) =>
        Number(a.level === 'Paused') - Number(b.level === 'Paused') ||
        b.gapHours - a.gapHours,
    );
  const activeEstimates = estimates.filter(
    (e) => !['Complete', 'Paused'].includes(e.level),
  );
  async function undo() {
    try {
      onCommit(
        await api.undoRecovery(state, undoId),
        'Recovery plan undone; original assignments and deadline restored.',
      );
      setUndoId('');
    } catch (e) {
      setError(errorMessage(e));
      setUndoId('');
    }
  }
  return (
    <div className="recovery-workspace">
      <section className="recovery-intro">
        <div className="recovery-symbol">
          <GitCompareArrows size={25} />
        </div>
        <div>
          <span className="eyebrow">FROM VISIBILITY TO DECISIONS</span>
          <h2>See the tradeoff before you make the move.</h2>
          <p>
            Compare a deadline change or staffing transfer. Find out which
            projects gain capacity—and which ones lose it—before applying a
            plan.
          </p>
        </div>
        <span className="subtle-chip">Explainable estimates · no AI API</span>
      </section>
      <div className="planning-toolbar">
        <span>
          <Clock3 size={16} /> Fixed fictional calendar · weekdays only
        </span>
        <label>
          Analysis date
          <input
            type="date"
            aria-label="Analysis date"
            value={asOf}
            onChange={(e) => {
              if (z.iso.date().safeParse(e.target.value).success)
                setAsOf(e.target.value);
            }}
          />
        </label>
      </div>
      <div className="risk-summary-grid">
        {[
          {
            title: 'Projects at risk',
            value: estimates.filter((e) => e.level === 'At risk').length,
            sub: 'Estimated work exceeds capacity',
            icon: TriangleAlert,
          },
          {
            title: 'Tight capacity',
            value: estimates.filter((e) => e.level === 'Tight').length,
            sub: 'Less than 15% buffer',
            icon: SlidersHorizontal,
          },
          {
            title: 'Scheduled capacity gap',
            value: `${Math.round(activeEstimates.reduce((n, e) => n + e.gapHours, 0))}h`,
            sub: 'Across scheduled projects',
            icon: Clock3,
          },
          {
            title: 'On hold',
            value: estimates.filter((e) => e.level === 'Paused').length,
            sub: 'Excluded from capacity allocation',
            icon: ShieldCheck,
          },
        ].map((k) => (
          <section className="panel risk-summary" key={k.title}>
            <div>
              <span>{k.title}</span>
              <k.icon size={17} />
            </div>
            <strong>{k.value}</strong>
            <small>{k.sub}</small>
          </section>
        ))}
      </div>
      <div className="recovery-grid">
        <section className="panel risk-queue">
          <div className="section-heading">
            <div>
              <h2>Delivery watchlist</h2>
              <p>Largest estimated gaps first</p>
            </div>
            <span className="count">{ranked.length}</span>
          </div>
          <div className="risk-queue-list">
            {ranked.map((e) => {
              const p = state.projects.find((p) => p.id === e.projectId)!;
              const disabled = p.status === 'On Hold' || p.progress === 100;
              return (
                <button
                  key={p.id}
                  aria-pressed={selected?.id === p.id}
                  disabled={disabled}
                  className={`risk-queue-item ${selected?.id === p.id ? 'selected' : ''}`}
                  onClick={() => setSelectedId(p.id)}
                >
                  <div>
                    <strong>{p.name}</strong>
                    <RiskBadge estimate={e} />
                  </div>
                  <span>
                    {p.department} ·{' '}
                    {disabled
                      ? 'Resume or review in Projects'
                      : `${e.workingDays} weekdays · ${e.activePeople} active staff`}
                  </span>
                  <div className="queue-numbers">
                    <span>{e.remainingHours}h remaining</span>
                    <strong>
                      {e.gapHours ? `${e.gapHours}h gap` : 'Capacity covered'}
                    </strong>
                  </div>
                </button>
              );
            })}
            {!ranked.length && (
              <div className="empty">
                <CheckCircle2 />
                <h3>No unfinished projects</h3>
                <p>Create a project to explore delivery planning.</p>
              </div>
            )}
          </div>
          <button className="text-button" onClick={onProjects}>
            Manage effort and project status <ArrowUpRight size={14} />
          </button>
        </section>
        {selected ? (
          <ScenarioEditor
            key={JSON.stringify(selected)}
            state={state}
            target={selected}
            asOf={asOf}
            canEdit={canEdit}
            onCommit={onCommit}
          />
        ) : (
          <section className="panel empty">
            <CheckCircle2 />
            <h2>No scheduled work to plan</h2>
            <p>
              Resume a paused project or create a new project with remaining
              effort.
            </p>
            <button onClick={onProjects}>
              Open projects <ArrowRight size={15} />
            </button>
          </section>
        )}
      </div>
      <details className="panel planning-method">
        <summary>How are these estimates calculated?</summary>
        <div className="method-grid">
          <div>
            <h3>Work still to do</h3>
            <p>
              Total estimated project hours × (1 − progress / 100). Older
              records without an estimate use 4 hours per task. Edit total
              effort in the project form.
            </p>
          </div>
          <div>
            <h3>Capacity without double-counting</h3>
            <p>
              Active employees have 6 project hours per weekday by default,
              editable in employee records (0–8h). Each person’s capacity is
              split equally across their overlapping scheduled projects, from
              the later of the analysis/start date through the due date,
              inclusive.
            </p>
          </div>
          <div>
            <h3>Transparent thresholds</h3>
            <p>
              At risk: capacity is below remaining effort. Tight: work is
              covered with less than 15% buffer. On track: at least 15% buffer,
              or no effort remains. Paused and completed work receives no
              allocation.
            </p>
          </div>
          <div>
            <h3>Limits of the model</h3>
            <p>
              No holidays, leave, skills, dependencies, overtime, or automatic
              completion are modeled. Capacity stays reserved until each due
              date. Dates and staffing are scenarios, not delivery promises,
              employee ratings, or burnout diagnoses.
            </p>
          </div>
        </div>
      </details>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Decision history</h2>
            <p>Applied plans are saved in this browser with their rationale.</p>
          </div>
          <span className="subtle-chip">Last 50 decisions</span>
        </div>
        {error && (
          <p role="alert" className="planning-error">
            {error}
          </p>
        )}
        {!state.recoveryPlans?.length && (
          <div className="history-empty">
            <GitCompareArrows size={22} />
            <p>
              No decisions applied yet. Preview a scenario above, inspect its
              tradeoffs, and record your reasoning.
            </p>
          </div>
        )}
        {state.recoveryPlans?.map((plan) => (
          <article className="decision-row" key={plan.id}>
            <div>
              <strong>{plan.projectName}</strong>
              <p>{plan.rationale}</p>
              <small>
                Analysis date {plan.asOf} ·{' '}
                {new Date(plan.appliedAt).toLocaleString('en-US')} ·{' '}
                {plan.before.length} project records changed
              </small>
            </div>
            {plan.undone ? (
              <span className="subtle-chip">Undone</span>
            ) : (
              <button
                disabled={!canEdit}
                onClick={() => {
                  setError('');
                  setUndoId(plan.id);
                }}
              >
                <Undo2 size={15} /> Undo plan
              </button>
            )}
          </article>
        ))}
      </section>
      {undoId && (
        <Modal title="Undo recovery plan?" onClose={() => setUndoId('')}>
          <p>
            This restores the saved assignments and deadlines. Undo is blocked
            if an affected project has since been edited, so newer work is
            protected.
          </p>
          <div className="dialog-actions">
            <button onClick={() => setUndoId('')}>Cancel</button>
            <button className="primary" onClick={() => void undo()}>
              Confirm undo
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function ScenarioEditor({
  state,
  target,
  asOf,
  canEdit,
  onCommit,
}: {
  state: DemoState;
  target: Project;
  asOf: string;
  canEdit: boolean;
  onCommit: (s: DemoState, message: string) => void;
}) {
  const [due, setDue] = useState(target.due),
    [employeeId, setEmployeeId] = useState(''),
    [sourceProjectId, setSourceProjectId] = useState(''),
    [rationale, setRationale] = useState(''),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const input: RecoveryScenario = {
    projectId: target.id,
    due,
    employeeId,
    sourceProjectId,
    asOf,
    rationale,
  };
  let preview: ReturnType<typeof previewRecovery> | null = null,
    previewError = '';
  try {
    preview = previewRecovery(state, input);
  } catch (e) {
    previewError = errorMessage(e);
  }
  const before = deliveryEstimates(state, asOf).find(
    (e) => e.projectId === target.id,
  )!;
  const after = preview?.after.find((e) => e.projectId === target.id) ?? before;
  const sideEffects =
    preview?.impacts.filter((e) => e.projectId !== target.id) ?? [];
  const worse = sideEffects.filter(
    (i) => i.after.capacityHours < i.before.capacityHours,
  );
  const sourceOptions = state.projects.filter(
    (p) =>
      p.id !== target.id &&
      p.status !== 'Completed' &&
      p.status !== 'On Hold' &&
      p.progress < 100 &&
      p.assignees.includes(employeeId),
  );
  function example() {
    const source = state.projects.find(
      (p) =>
        p.id !== target.id &&
        p.status !== 'Completed' &&
        p.status !== 'On Hold' &&
        p.progress < 100 &&
        p.assignees.length > 1 &&
        p.assignees.some(
          (id) =>
            target.assignees.includes(id) &&
            state.users.some(
              (u) =>
                u.id === id && u.active && (u.capacityHoursPerDay ?? 6) > 0,
            ),
        ),
    );
    const person = source?.assignees.find(
      (id) =>
        target.assignees.includes(id) &&
        state.users.some(
          (u) => u.id === id && u.active && (u.capacityHoursPerDay ?? 6) > 0,
        ),
    );
    const base = target.due > asOf ? target.due : asOf;
    const later = new Date(`${base}T00:00:00Z`);
    later.setUTCDate(later.getUTCDate() + 10);
    setDue(later.toISOString().slice(0, 10));
    setEmployeeId(person ?? '');
    setSourceProjectId(source?.id ?? '');
    setRationale('');
    setError('');
  }
  async function apply() {
    setBusy(true);
    setError('');
    try {
      onCommit(
        await api.applyRecovery(state, input),
        'Recovery plan applied. Projects, estimates, and decision history updated.',
      );
      setConfirm(false);
    } catch (e) {
      setError(errorMessage(e));
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel scenario-editor">
      <div className="section-heading">
        <div>
          <span className="eyebrow">SCENARIO PREVIEW</span>
          <h2>{target.name}</h2>
          <p>Nothing changes until you review and apply.</p>
        </div>
        <GitCompareArrows size={21} />
      </div>
      <div className="example-prompt">
        <span>
          Start with an illustrative scenario, then inspect the tradeoffs.
        </span>
        <button className="text-button" onClick={example}>
          Load example <ArrowRight size={14} />
        </button>
      </div>
      <div className="scenario-inputs">
        <label>
          Proposed due date
          <input
            type="date"
            aria-label="Proposed due date"
            min={target.start}
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </label>
        <label>
          Employee to add or rebalance
          <select
            aria-label="Employee to add or rebalance"
            value={employeeId}
            onChange={(e) => {
              setEmployeeId(e.target.value);
              setSourceProjectId('');
            }}
          >
            <option value="">Keep current team</option>
            {state.users
              .filter((u) => u.active && (u.capacityHoursPerDay ?? 6) > 0)
              .sort(
                (a, b) =>
                  Number(b.department === target.department) -
                    Number(a.department === target.department) ||
                  a.name.localeCompare(b.name),
              )
              .map((u) => (
                <option value={u.id} key={u.id}>
                  {u.name} · {u.capacityHoursPerDay ?? 6}h/day
                  {target.assignees.includes(u.id) ? ' · already assigned' : ''}
                </option>
              ))}
          </select>
        </label>
        <label className="full">
          Allocation approach
          <select
            aria-label="Allocation approach"
            value={sourceProjectId}
            disabled={!employeeId}
            onChange={(e) => setSourceProjectId(e.target.value)}
          >
            <option value="">Share capacity across existing assignments</option>
            {sourceOptions.map((p) => (
              <option value={p.id} key={p.id} disabled={p.assignees.length < 2}>
                Transfer from {p.name}
                {p.assignees.length < 2
                  ? ' (only assignee; transfer blocked)'
                  : ''}
              </option>
            ))}
          </select>
          <small>
            Sharing splits capacity; transferring removes only the selected
            source assignment. Other assignments remain in place.
          </small>
        </label>
      </div>
      {previewError && (
        <p className="planning-error" role="alert">
          {previewError}
        </p>
      )}
      <div className="comparison-grid">
        <section className="comparison-card">
          <span className="eyebrow">CURRENT PLAN</span>
          <RiskBadge estimate={before} />
          <strong>
            {before.capacityHours}
            <small>h capacity</small>
          </strong>
          <p>
            {before.remainingHours}h work remaining · {before.gapHours}h gap
          </p>
          <span className="muted">Due {target.due}</span>
        </section>
        <section className="comparison-card proposed">
          <span className="eyebrow">PROPOSED PLAN</span>
          <RiskBadge estimate={after} />
          <strong data-testid="proposed-capacity">
            {preview ? after.capacityHours : '—'}
            <small>h capacity</small>
          </strong>
          <p>
            {after.remainingHours}h work remaining ·{' '}
            <span data-testid="proposed-gap">
              {preview ? after.gapHours : '—'}h gap
            </span>
          </p>
          <span className="muted">Due {due || 'Choose a date'}</span>
        </section>
      </div>
      <div className="estimate-explanation">
        <h3>Why this estimate?</h3>
        <ul>
          {(preview ? after : before).reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        <p>
          {target.estimatedHours ?? target.tasks * 4}h total effort ×{' '}
          {100 - target.progress}% unfinished = {before.remainingHours}h
          remaining. Dates include weekdays only.
        </p>
      </div>
      <div className="impact-heading">
        <h3>Impact on other projects</h3>
        <span className="subtle-chip">{sideEffects.length} affected</span>
      </div>
      {sideEffects.length ? (
        <div
          className="table-scroll"
          role="region"
          aria-label="Scenario impact table"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Capacity before → after</th>
                <th>Delivery estimate</th>
              </tr>
            </thead>
            <tbody>
              {sideEffects.map((i) => (
                <tr key={i.projectId}>
                  <td>
                    {state.projects.find((p) => p.id === i.projectId)?.name}
                  </td>
                  <td
                    className={
                      i.after.capacityHours < i.before.capacityHours
                        ? 'capacity-loss'
                        : 'positive'
                    }
                  >
                    {i.before.capacityHours}h → {i.after.capacityHours}h
                  </td>
                  <td>
                    <RiskBadge estimate={i.after} />
                    <small className="prior-risk">
                      Previously {i.before.level}
                    </small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="impact-empty">
          {preview?.touched.length
            ? 'No other project’s estimated capacity changes.'
            : 'Adjust the date or staffing to compare downstream effects.'}
        </p>
      )}
      {worse.length > 0 && (
        <div className="tradeoff-warning" role="status">
          <TriangleAlert size={18} />
          <span>
            {worse.length} other{' '}
            {worse.length === 1 ? 'project loses' : 'projects lose'} capacity in
            this scenario. Review the tradeoff before applying.
          </span>
        </div>
      )}
      <label className="decision-reason">
        Decision rationale
        <textarea
          aria-label="Decision rationale"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          maxLength={500}
          placeholder="Why is this tradeoff appropriate? Record the reasoning for your demo team."
          rows={3}
        />
        <small>10–500 characters · saved with the plan</small>
      </label>
      {error && (
        <p className="planning-error" role="alert">
          {error}
        </p>
      )}
      <div className="scenario-actions">
        <button
          onClick={() => {
            setDue(target.due);
            setEmployeeId('');
            setSourceProjectId('');
            setRationale('');
            setError('');
          }}
        >
          Discard preview
        </button>
        <button
          className="primary"
          disabled={
            !canEdit ||
            !preview?.touched.length ||
            rationale.trim().length < 10 ||
            busy
          }
          onClick={() => setConfirm(true)}
        >
          Review & apply plan <ArrowRight size={16} />
        </button>
      </div>
      {!canEdit && (
        <p className="muted">
          Read-only role preview: scenarios are available, but applying and
          undoing are disabled.
        </p>
      )}
      {confirm && (
        <Modal
          title="Review recovery decision"
          onClose={() => setConfirm(false)}
        >
          <p>
            <strong>{target.name}</strong>
            <br />
            Due date: {target.due} → {due}
            <br />
            {preview?.touched.length} project records will change.
          </p>
          <p>
            {sideEffects.length} other project estimates change; {worse.length}{' '}
            lose capacity. The before/after records and your rationale will be
            saved locally.
          </p>
          <blockquote>{rationale}</blockquote>
          <p className="muted">
            This is an estimate using the displayed assumptions, not a delivery
            guarantee. Undo is available if the affected records are unchanged.
          </p>
          <div className="dialog-actions">
            <button onClick={() => setConfirm(false)}>Keep exploring</button>
            <button
              className="primary"
              disabled={busy || !canEdit}
              onClick={() => void apply()}
            >
              {busy ? 'Applying…' : 'Confirm recovery plan'}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
