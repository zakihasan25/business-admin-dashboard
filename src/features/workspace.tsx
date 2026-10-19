'use client';
import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  LayoutDashboard,
  GitCompareArrows,
  Users,
  ShieldCheck,
  FolderKanban,
  ChartNoAxesCombined,
  Activity,
  Settings,
  Info,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  Menu,
  LogOut,
  Sun,
  Moon,
  Download,
  Check,
  BriefcaseBusiness,
  DollarSign,
  ListTodo,
  X,
  CircleHelp,
} from 'lucide-react';
import { fixtures } from '@/data/fixtures';
import {
  departments,
  roles,
  statuses,
  type DemoState,
  type User,
  type Project,
} from '@/lib/model';
import { api, loadState, saveState, metrics, csv } from '@/lib/mock-api';
import { Modal } from '@/components/ui/modal';
import { UserForm, ProjectForm } from './forms';
import { deliveryEstimates } from '@/lib/delivery-risk';
const RecoveryPlanner = dynamic(
  () => import('./recovery-planner').then((m) => m.RecoveryPlanner),
  {
    ssr: false,
    loading: () => <div className="panel">Loading delivery planner…</div>,
  },
);
const RevenueChart = dynamic(
  () => import('./charts').then((m) => m.RevenueChart),
  {
    ssr: false,
    loading: () => <div className="chart muted">Loading chart…</div>,
  },
);
const WorkloadChart = dynamic(
  () => import('./charts').then((m) => m.WorkloadChart),
  { ssr: false },
);
const nav = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'Employees', icon: Users },
  { name: 'Roles & permissions', icon: ShieldCheck },
  { name: 'Projects', icon: FolderKanban },
  { name: 'Delivery planner', icon: GitCompareArrows },
  { name: 'Analytics', icon: ChartNoAxesCombined },
  { name: 'Activity', icon: Activity },
  { name: 'Settings', icon: Settings },
  { name: 'About this project', icon: Info },
];
const money = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v);
const initials = (s: string) =>
  s
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');
function Badge({ value }: { value: string }) {
  return (
    <span className={`badge ${value.toLowerCase().replaceAll(' ', '-')}`}>
      <i />
      {value}
    </span>
  );
}
export default function Workspace() {
  const [state, setState] = useState<DemoState>(fixtures),
    [ready, setReady] = useState(false),
    [session, setSession] = useState(false),
    [page, setPage] = useState('Overview'),
    [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false),
    [query, setQuery] = useState(''),
    [filter, setFilter] = useState('All'),
    [sort, setSort] = useState('name'),
    [index, setIndex] = useState(1),
    [range, setRange] = useState('6'),
    [toast, setToast] = useState(''),
    [user, setUser] = useState<User | null>(null),
    [project, setProject] = useState<Project | null>(null),
    [detail, setDetail] = useState<User | Project | null>(null),
    [confirm, setConfirm] = useState<{
      title: string;
      action: () => void;
    } | null>(null),
    [notifications, setNotifications] = useState(false),
    [previewRole, setPreviewRole] = useState('Administrator');
  useEffect(() => {
    const timer = setTimeout(() => {
      const loaded = loadState({
        getItem: (key) => window.localStorage.getItem(key),
      });
      setState(loaded.data);
      try {
        setSession(sessionStorage.getItem('demo-session') === 'yes');
      } catch {}
      const hash = decodeURIComponent(window.location.hash.slice(1));
      const initial = nav.find(
        (n) => n.name.toLowerCase().replaceAll(' ', '-') === hash,
      );
      if (initial) setPage(initial.name);
      if (loaded.recovered)
        setToast('Stored data was invalid. Original sample data restored.');
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (ready) document.documentElement.dataset.theme = state.settings.theme;
  }, [ready, state.settings.theme]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  function commit(next: DemoState, message = 'Changes saved') {
    setState(next);
    try {
      saveState(localStorage, next);
      setToast(message);
    } catch {
      setToast(
        'Changes work for this visit, but browser storage is unavailable.',
      );
    }
  }
  function go(name: string) {
    setPage(name);
    setSort('name');
    setQuery('');
    setFilter('All');
    setIndex(1);
    setMobile(false);
    window.history.replaceState(
      null,
      '',
      `#${name.toLowerCase().replaceAll(' ', '-')}`,
    );
  }
  const summary = metrics(state),
    financials = state.financials.slice(-Number(range)),
    revenue = financials.reduce((n, r) => n + r.revenue, 0),
    canEdit = previewRole === 'Administrator' || previewRole === 'Manager';
  const riskCount = useMemo(
    () => deliveryEstimates(state).filter((e) => e.level === 'At risk').length,
    [state],
  );
  const filteredUsers = useMemo(
    () =>
      state.users
        .filter(
          (u) =>
            `${u.name} ${u.email}`
              .toLowerCase()
              .includes(query.toLowerCase()) &&
            (filter === 'All' ||
              u.department === filter ||
              u.role === filter ||
              (filter === 'Active' && u.active) ||
              (filter === 'Inactive' && !u.active)),
        )
        .sort((a, b) =>
          sort === 'name-desc'
            ? b.name.localeCompare(a.name)
            : sort === 'department'
              ? a.department.localeCompare(b.department)
              : a.name.localeCompare(b.name),
        ),
    [state.users, query, filter, sort],
  );
  const filteredProjects = useMemo(
    () =>
      state.projects
        .filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) &&
            (filter === 'All' || p.status === filter || p.priority === filter),
        )
        .sort((a, b) =>
          sort === 'due'
            ? a.due.localeCompare(b.due)
            : sort === 'progress'
              ? b.progress - a.progress
              : a.name.localeCompare(b.name),
        ),
    [state.projects, query, filter, sort],
  );
  const pageSize = state.settings.pageSize;
  const currentIndex = Math.min(
    index,
    Math.max(
      1,
      Math.ceil(
        (page === 'Employees'
          ? filteredUsers.length
          : filteredProjects.length) / pageSize,
      ),
    ),
  );
  function exportReport() {
    const content = csv([
      ['Month', 'Sample revenue USD', 'Sample operating costs USD'],
      ...financials.map((r) => [r.month, r.revenue, r.cost]),
    ]);
    const url = URL.createObjectURL(
      new Blob([content], { type: 'text/csv;charset=utf-8;' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'northstar-sample-report.csv';
    a.click();
    URL.revokeObjectURL(url);
    setToast('Sample report exported');
  }
  function reset() {
    setConfirm({
      title:
        'Reset all demo data? Your browser edits and preferences will be replaced with the original fictional records.',
      action: () => {
        commit(fixtures(), 'Demo data reset successfully');
        setPreviewRole('Administrator');
        setConfirm(null);
      },
    });
  }
  async function saveUser(u: User) {
    try {
      commit(await api.saveUser(state, u));
      setUser(null);
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Unable to save employee');
    }
  }
  async function saveProject(p: Project) {
    try {
      commit(
        await api.saveProject(state, {
          ...p,
          progress: p.status === 'Completed' ? 100 : p.progress,
        }),
      );
      setProject(null);
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Unable to save project');
    }
  }
  const selectRange = (
    <select
      aria-label="Report date range"
      value={range}
      onChange={(e) => setRange(e.target.value)}
    >
      <option value="3">Oct – Dec 2026</option>
      <option value="6">Jul – Dec 2026</option>
      <option value="12">Jan – Dec 2026</option>
    </select>
  );
  const pagination = (count: number) => (
    <div className="pagination">
      <span>
        Showing {count ? (currentIndex - 1) * pageSize + 1 : 0}–
        {Math.min(currentIndex * pageSize, count)} of {count} records
      </span>
      <div>
        <button
          aria-label="Previous page"
          disabled={currentIndex === 1}
          onClick={() => setIndex(currentIndex - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span>
          Page {currentIndex} of {Math.max(1, Math.ceil(count / pageSize))}
        </span>
        <button
          aria-label="Next page"
          disabled={currentIndex * pageSize >= count}
          onClick={() => setIndex(currentIndex + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
  const tools = (kind: 'users' | 'projects') => (
    <div className="table-tools">
      <div className="search-field">
        <Search size={17} />
        <input
          aria-label={`Search ${kind}`}
          placeholder={
            kind === 'users' ? 'Search employees…' : 'Search projects…'
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(1);
          }}
        />
      </div>
      <select
        aria-label="Filter records"
        value={filter}
        onChange={(e) => {
          setFilter(e.target.value);
          setIndex(1);
        }}
      >
        {[
          'All',
          ...(kind === 'users'
            ? [...departments, 'Active', 'Inactive', ...roles]
            : [...statuses, 'High', 'Medium', 'Low']),
        ].map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
      <select
        aria-label="Sort records"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
      >
        <option value="name">Name A–Z</option>
        {kind === 'users' ? (
          <>
            <option value="name-desc">Name Z–A</option>
            <option value="department">Department</option>
          </>
        ) : (
          <>
            <option value="due">Due date</option>
            <option value="progress">Progress</option>
          </>
        )}
      </select>
    </div>
  );
  const projectTable = (items: Project[], compact = false) => (
    <div
      className="table-scroll"
      role="region"
      aria-label="Scrollable records table"
      tabIndex={0}
    >
      <table>
        <thead>
          <tr>
            <th>Project name</th>
            <th>Status</th>
            {!compact && <th>Team</th>}
            <th>Progress</th>
            <th>Due date</th>
            {!compact && <th>Priority</th>}
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((p, i) => (
            <tr key={p.id}>
              <td>
                <button className="name-button" onClick={() => setDetail(p)}>
                  <span className={`project-mark mark-${i % 4}`}>
                    <FolderKanban size={17} />
                  </span>
                  <span>
                    {p.name}
                    <small>{p.department}</small>
                  </span>
                </button>
              </td>
              <td>
                <Badge value={p.status} />
              </td>
              {!compact && (
                <td>
                  <div className="avatar-stack">
                    {p.assignees.map((id) => (
                      <span
                        className="avatar"
                        title={state.users.find((u) => u.id === id)?.name}
                        key={id}
                      >
                        {initials(
                          state.users.find((u) => u.id === id)?.name || '?',
                        )}
                      </span>
                    ))}
                  </div>
                </td>
              )}
              <td>
                <div className="progress-wrap">
                  <div className="progress">
                    <span style={{ width: `${p.progress}%` }} />
                  </div>
                  <small>{p.progress}%</small>
                </div>
              </td>
              <td className="muted">
                {new Date(p.due + 'T12:00:00').toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </td>
              {!compact && (
                <td>
                  <Badge value={p.priority} />
                </td>
              )}
              <td>
                <button
                  className="text-button"
                  disabled={!canEdit}
                  onClick={() => setProject(p)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!items.length && (
        <div className="empty">
          <Search />
          <h3>No matching projects</h3>
          <p>Try a different search or filter.</p>
        </div>
      )}
    </div>
  );
  if (!ready) return <main className="loading">Preparing your workspace…</main>;
  return (
    <>
      {!session ? (
        <main className="welcome">
          <div className="welcome-brand">
            <div className="brand-icon">n</div> NORTHSTAR{' '}
            <span> / Business Admin Dashboard</span>
          </div>
          <div className="welcome-grid">
            <section>
              <span className="eyebrow">AN INDEPENDENT PORTFOLIO PROJECT</span>
              <h1>
                A clearer view.
                <br />A better workday.
              </h1>
              <p>
                Manage people and projects. Preview delivery recovery plans—and
                understand their impact before making a change.
              </p>
              <button
                className="primary large"
                onClick={() => {
                  setSession(true);
                  try {
                    sessionStorage.setItem('demo-session', 'yes');
                  } catch {
                    setToast('Browser session storage unavailable.');
                  }
                }}
              >
                Enter Demo <ArrowRight size={18} />
              </button>
              <div className="welcome-note">
                <ShieldCheck size={18} />
                <span>
                  Public interactive demo. No account or password needed.
                  <br />
                  All organizations and records are fictional.
                </span>
              </div>
              <div className="welcome-stats">
                <div>
                  <strong>40</strong>
                  <span>Sample employees</span>
                </div>
                <div>
                  <strong>20</strong>
                  <span>Fictional projects</span>
                </div>
                <div>
                  <strong>9</strong>
                  <span>Connected modules</span>
                </div>
              </div>
            </section>
            <section className="welcome-preview">
              <div className="preview-top">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
                <small>YOUR OPERATIONS, IN FOCUS</small>
              </div>
              <div className="preview-content">
                <span className="eyebrow">WORKSPACE OVERVIEW</span>
                <h2>Built for the bigger picture.</h2>
                <div className="mini-cards">
                  <div>
                    <span>Active projects</span>
                    <strong>
                      15 <ArrowUpRight size={22} />
                    </strong>
                    <small>Across five departments</small>
                  </div>
                  <div>
                    <span>Team members</span>
                    <strong>
                      36 <Users size={22} />
                    </strong>
                    <small>One connected workspace</small>
                  </div>
                </div>
                <div className="mini-bars">
                  {[35, 52, 44, 69, 60, 82, 74, 95, 87, 100, 90, 110].map(
                    (h, i) => (
                      <span style={{ height: h }} key={i} />
                    ),
                  )}
                </div>
                <p>Explore real interactions with fictional data.</p>
                <div className="preview-foot">
                  <Check size={16} /> Browser persistence <Check size={16} />{' '}
                  Static frontend
                </div>
              </div>
            </section>
          </div>
          <footer>
            Designed & built as a software engineering portfolio demonstration.
            Data stays in your browser.
          </footer>
        </main>
      ) : (
        <div className={`app ${collapsed ? 'is-collapsed' : ''}`}>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <aside className={`sidebar ${mobile ? 'mobile-open' : ''}`}>
            <button className="brand" onClick={() => go('Overview')}>
              <span className="brand-icon">n</span>
              <span className="brand-text">
                northstar<span>BUSINESS WORKSPACE</span>
              </span>
            </button>
            <div className="org-card">
              <span className="org-icon">N</span>
              <div className="brand-text">
                <strong>{state.settings.organization}</strong>
                <small>Portfolio workspace</small>
              </div>
              <span className="live-dot" />
            </div>
            <span className="nav-label">WORKSPACE</span>
            <nav>
              {nav.slice(0, 7).map((n) => (
                <button
                  key={n.name}
                  aria-label={n.name}
                  aria-current={page === n.name ? 'page' : undefined}
                  className={page === n.name ? 'active' : ''}
                  onClick={() => go(n.name)}
                >
                  <n.icon size={19} />
                  <span>{n.name}</span>
                  {n.name === 'Employees' && (
                    <small>{state.users.length}</small>
                  )}
                  {n.name === 'Activity' && <i className="nav-dot" />}
                </button>
              ))}
            </nav>
            <div className="nav-bottom">
              <span className="nav-label">PREFERENCES</span>
              <nav>
                {nav.slice(7).map((n) => (
                  <button
                    key={n.name}
                    aria-label={n.name}
                    className={page === n.name ? 'active' : ''}
                    onClick={() => go(n.name)}
                  >
                    <n.icon size={19} />
                    <span>{n.name}</span>
                  </button>
                ))}
              </nav>
              <div className="demo-card">
                <span className="eyebrow">EXPLORE WITH CONFIDENCE</span>
                <p>Your own demo workspace.</p>
                <small>Try things out. Reset any time.</small>
                <button onClick={() => go('About this project')}>
                  About this demo <ArrowUpRight size={14} />
                </button>
              </div>
              <button className="profile" onClick={() => go('Settings')}>
                <span className="avatar">AV</span>
                <span className="brand-text">
                  <strong>Avery Vale</strong>
                  <small>Demo administrator</small>
                </span>
                <Settings size={16} />
              </button>
            </div>
          </aside>
          {mobile && (
            <button
              className="mobile-scrim"
              aria-label="Close navigation"
              onClick={() => setMobile(false)}
            />
          )}
          <div className="workspace">
            <header>
              <div className="breadcrumbs">
                <button
                  className="icon-button desktop"
                  aria-label="Collapse sidebar"
                  onClick={() => setCollapsed(!collapsed)}
                >
                  <PanelLeftClose size={19} />
                </button>
                <button
                  className="icon-button mobile"
                  aria-label="Open navigation"
                  onClick={() => setMobile(true)}
                >
                  <Menu size={20} />
                </button>
                <span>Workspace</span>
                <ChevronRight size={14} />
                <strong>{page}</strong>
              </div>
              <div className="header-actions">
                <span className="demo-pill">
                  <span /> Portfolio demo
                </span>
                <button
                  className="icon-button"
                  aria-label="Toggle theme"
                  onClick={() =>
                    commit(
                      {
                        ...state,
                        settings: {
                          ...state.settings,
                          theme:
                            state.settings.theme === 'light' ? 'dark' : 'light',
                        },
                      },
                      'Theme updated',
                    )
                  }
                >
                  {state.settings.theme === 'light' ? (
                    <Moon size={18} />
                  ) : (
                    <Sun size={18} />
                  )}
                </button>
                <button
                  className="icon-button notification-button"
                  aria-label="Notifications"
                  onClick={() => setNotifications(!notifications)}
                >
                  <Bell size={19} />
                  {state.notifications.some((n) => !n.read) && <i />}
                </button>
                <button
                  className="icon-button"
                  aria-label="Exit demo"
                  onClick={() => {
                    setSession(false);
                    try {
                      sessionStorage.removeItem('demo-session');
                    } catch {}
                  }}
                >
                  <LogOut size={18} />
                </button>
                <span className="avatar header-avatar">AV</span>
              </div>
            </header>
            <main id="main">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    {page === 'Overview'
                      ? 'MONDAY, OCTOBER 19, 2026'
                      : 'NORTHSTAR WORKSPACE'}
                  </div>
                  <h1>
                    {page === 'Overview' ? 'Your business, at a glance.' : page}
                  </h1>
                  <p>
                    {
                      (
                        {
                          Overview:
                            'Welcome back, Avery. Here’s what’s happening across your workspace.',
                          Employees:
                            'The people behind your progress. Manage your fictional team in one place.',
                          Projects:
                            'Keep priorities aligned and move meaningful work forward.',
                          'Delivery planner':
                            'Explain delivery risks. Compare recovery options. Understand the tradeoffs.',
                          Analytics:
                            'Turn sample business data into a clearer picture.',
                          Activity:
                            'A shared timeline of changes across your workspace.',
                          Settings:
                            'Make this browser workspace feel like your own.',
                          'Roles & permissions':
                            'Explore how different access levels shape the experience.',
                          'About this project':
                            'A practical demonstration of modern business software.',
                        } as Record<string, string>
                      )[page]
                    }
                  </p>
                </div>
                <div className="heading-actions">
                  {(page === 'Overview' || page === 'Analytics') && (
                    <>
                      {selectRange}
                      <button onClick={exportReport}>
                        <Download size={16} /> Export report
                      </button>
                    </>
                  )}
                  {page === 'Employees' && (
                    <button
                      className="primary"
                      disabled={!canEdit}
                      onClick={() =>
                        setUser({
                          id: crypto.randomUUID(),
                          name: '',
                          email: '',
                          department: 'Operations',
                          role: 'Team Member',
                          active: true,
                        })
                      }
                    >
                      <Plus size={17} /> Add employee
                    </button>
                  )}
                  {page === 'Projects' && (
                    <button
                      className="primary"
                      disabled={!canEdit}
                      onClick={() =>
                        setProject({
                          id: crypto.randomUUID(),
                          name: '',
                          department: 'Operations',
                          status: 'Planning',
                          priority: 'Medium',
                          start: '2026-10-19',
                          due: '2026-11-19',
                          progress: 0,
                          assignees: [state.users[0].id],
                          tasks: 10,
                        })
                      }
                    >
                      <Plus size={17} /> New project
                    </button>
                  )}
                </div>
              </div>
              {page === 'Delivery planner' && (
                <RecoveryPlanner
                  state={state}
                  canEdit={canEdit}
                  onCommit={commit}
                  onProjects={() => go('Projects')}
                />
              )}
              {page === 'Overview' && (
                <section className="overview-recovery">
                  <div className="recovery-symbol">
                    <GitCompareArrows size={24} />
                  </div>
                  <div>
                    <span className="eyebrow">DECISION WORKSPACE</span>
                    <h2>{riskCount} projects need a closer look.</h2>
                    <p>
                      Preview staffing and deadline changes—and see the impact
                      on other projects before applying.
                    </p>
                  </div>
                  <button
                    className="primary"
                    onClick={() => go('Delivery planner')}
                  >
                    Explore recovery planner <ArrowRight size={16} />
                  </button>
                </section>
              )}
              {previewRole !== 'Administrator' && (
                <div className="notice">
                  Simulated {previewRole} view ·{' '}
                  {canEdit
                    ? 'Employee and project editing enabled.'
                    : 'Editing disabled. Switch back to Administrator in Roles & permissions.'}{' '}
                  This is a UI demonstration only.
                </div>
              )}
              {(page === 'Overview' || page === 'Analytics') && (
                <>
                  <div className="kpi-grid">
                    {[
                      {
                        label: 'Active projects',
                        value: summary.activeProjects,
                        sub: `${state.projects.length} projects in the workspace`,
                        icon: BriefcaseBusiness,
                      },
                      {
                        label: 'Active employees',
                        value: summary.activeEmployees,
                        sub: 'Across 5 departments',
                        icon: Users,
                      },
                      {
                        label: 'Pending tasks',
                        value: summary.pendingTasks,
                        sub: 'Estimated from project progress',
                        icon: ListTodo,
                      },
                      {
                        label:
                          page === 'Overview'
                            ? 'Monthly revenue'
                            : 'Period revenue',
                        value: money(
                          page === 'Overview'
                            ? financials[financials.length - 1].revenue
                            : revenue,
                        ),
                        sub:
                          page === 'Overview'
                            ? 'December 2026 · sample USD'
                            : 'Selected period · sample USD',
                        icon: DollarSign,
                      },
                    ].map((k, i) => (
                      <section className="kpi" key={k.label}>
                        <div>
                          <span>{k.label}</span>
                          <k.icon size={18} />
                        </div>
                        <strong data-testid={`metric-${i}`}>{k.value}</strong>
                        <small>
                          {i === 0 ? (
                            <span className="positive">
                              {summary.completed} completed
                            </span>
                          ) : i === 1 ? (
                            <span className="positive">
                              {Math.round(
                                (summary.activeEmployees / state.users.length) *
                                  100,
                              )}
                              % active
                            </span>
                          ) : null}
                          {i < 2 ? ' · ' : ''}
                          {k.sub}
                        </small>
                      </section>
                    ))}
                  </div>
                  <div className="chart-grid">
                    <section className="panel revenue-panel">
                      <div className="section-heading">
                        <div>
                          <h2>Revenue overview</h2>
                          <p>Sample financial performance · USD</p>
                        </div>
                        <span className="subtle-chip">
                          {financials.length} months
                        </span>
                      </div>
                      <div className="revenue-summary">
                        <strong>{money(revenue)}</strong>
                        <span className="positive">
                          Selected period revenue
                        </span>
                        <div className="legend">
                          <span>
                            <i />
                            Revenue
                          </span>
                          <span>
                            <i />
                            Operating costs
                          </span>
                        </div>
                      </div>
                      <RevenueChart data={financials} />
                    </section>
                    <section className="panel">
                      <div className="section-heading">
                        <div>
                          <h2>Project health</h2>
                          <p>A snapshot of your project pipeline</p>
                        </div>
                        <FolderKanban size={18} />
                      </div>
                      <div
                        className="donut"
                        style={{
                          background: `conic-gradient(#15967d 0 ${(state.projects.filter((p) => p.status === 'Completed').length / state.projects.length) * 100}%, #5475d1 0 ${(state.projects.filter((p) => ['Completed', 'In Progress'].includes(p.status)).length / state.projects.length) * 100}%, #e7af53 0 ${(state.projects.filter((p) => p.status !== 'Planning').length / state.projects.length) * 100}%, #cbd5dd 0)`,
                        }}
                      >
                        <div>
                          <strong>{state.projects.length}</strong>
                          <span>Total projects</span>
                        </div>
                      </div>
                      <div className="status-legend">
                        {statuses.map((s, i) => (
                          <div key={s}>
                            <span>
                              <i
                                style={{
                                  background: [
                                    '#cbd5dd',
                                    '#5475d1',
                                    '#e7af53',
                                    '#15967d',
                                  ][i],
                                }}
                              />
                              {s}
                            </span>
                            <strong>
                              {
                                state.projects.filter((p) => p.status === s)
                                  .length
                              }
                            </strong>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </>
              )}
              {page === 'Overview' && (
                <>
                  <section className="panel projects-panel">
                    <div className="section-heading">
                      <div>
                        <h2>
                          Projects in focus{' '}
                          <span className="count">
                            {summary.activeProjects}
                          </span>
                        </h2>
                        <p>A little visibility goes a long way.</p>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => go('Projects')}
                      >
                        All projects <ArrowRight size={15} />
                      </button>
                    </div>
                    {projectTable(
                      state.projects
                        .filter((p) => p.status !== 'Completed')
                        .slice(0, 4),
                      true,
                    )}
                  </section>
                  <div className="bottom-grid">
                    <section className="panel">
                      <div className="section-heading">
                        <h2>Recent activity</h2>
                        <button
                          className="text-button"
                          onClick={() => go('Activity')}
                        >
                          View all <ArrowRight size={14} />
                        </button>
                      </div>
                      {state.activities.slice(0, 3).map((a, i) => (
                        <div className="activity-row" key={a.id}>
                          <span className={`activity-icon mark-${i}`}>
                            <Activity size={16} />
                          </span>
                          <div>
                            <strong>{a.text}</strong>
                            <small>
                              {new Date(a.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              · Workspace activity
                            </small>
                          </div>
                        </div>
                      ))}
                    </section>
                    <section className="panel">
                      <div className="section-heading">
                        <h2>Upcoming deadlines</h2>
                        <span className="subtle-chip">Demo calendar</span>
                      </div>
                      {state.projects
                        .filter((p) => p.status !== 'Completed')
                        .sort((a, b) => a.due.localeCompare(b.due))
                        .slice(0, 3)
                        .map((p) => (
                          <button
                            className="deadline-row"
                            key={p.id}
                            onClick={() => setDetail(p)}
                          >
                            <span className="date-box">
                              <small>OCT</small>
                              {p.due.slice(-2)}
                            </span>
                            <span>
                              <strong>{p.name}</strong>
                              <small>{p.department}</small>
                            </span>
                            <ChevronRight size={16} />
                          </button>
                        ))}
                    </section>
                  </div>
                </>
              )}
              {page === 'Employees' && (
                <section className="panel table-panel">
                  <div className="section-heading">
                    <h2>
                      All employees{' '}
                      <span className="count">{state.users.length}</span>
                    </h2>
                    <span className="muted">Fictional team directory</span>
                  </div>
                  {tools('users')}
                  <div
                    className="table-scroll"
                    role="region"
                    aria-label="Scrollable records table"
                    tabIndex={0}
                  >
                    <table>
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Department</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers
                          .slice(
                            (currentIndex - 1) * pageSize,
                            currentIndex * pageSize,
                          )
                          .map((u, i) => (
                            <tr key={u.id}>
                              <td>
                                <button
                                  className="name-button"
                                  onClick={() => setDetail(u)}
                                >
                                  <span className={`avatar mark-${i % 4}`}>
                                    {initials(u.name)}
                                  </span>
                                  <span>
                                    {u.name}
                                    <small>{u.email}</small>
                                  </span>
                                </button>
                              </td>
                              <td>{u.department}</td>
                              <td>{u.role}</td>
                              <td>
                                <Badge
                                  value={u.active ? 'Active' : 'Inactive'}
                                />
                              </td>
                              <td>
                                <div className="inline-actions">
                                  <button
                                    className="text-button"
                                    disabled={!canEdit}
                                    onClick={() => setUser(u)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="text-button"
                                    disabled={!canEdit}
                                    onClick={() =>
                                      setConfirm({
                                        title: `${u.active ? 'Deactivate' : 'Activate'} ${u.name}?`,
                                        action: () => {
                                          void saveUser({
                                            ...u,
                                            active: !u.active,
                                          });
                                          setConfirm(null);
                                        },
                                      })
                                    }
                                  >
                                    {u.active ? 'Deactivate' : 'Activate'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {!filteredUsers.length && (
                      <div className="empty">
                        <Users />
                        <h3>No employees found</h3>
                        <p>Try a different search or department.</p>
                      </div>
                    )}
                  </div>
                  {pagination(filteredUsers.length)}
                </section>
              )}
              {page === 'Projects' && (
                <section className="panel table-panel">
                  <div className="section-heading">
                    <h2>
                      Project directory{' '}
                      <span className="count">{state.projects.length}</span>
                    </h2>
                    <span className="muted">All fictional workstreams</span>
                  </div>
                  {tools('projects')}
                  {projectTable(
                    filteredProjects.slice(
                      (currentIndex - 1) * pageSize,
                      currentIndex * pageSize,
                    ),
                  )}
                  {pagination(filteredProjects.length)}
                </section>
              )}
              {page === 'Analytics' && (
                <>
                  <div className="chart-grid">
                    <section className="panel">
                      <div className="section-heading">
                        <div>
                          <h2>Department workload</h2>
                          <p>Current project allocation · all dates</p>
                        </div>
                      </div>
                      <WorkloadChart
                        data={departments.map((name) => ({
                          name,
                          projects: state.projects.filter(
                            (p) =>
                              p.department === name && p.status !== 'Completed',
                          ).length,
                        }))}
                      />
                    </section>
                    <section className="panel">
                      <h2>Report summary</h2>
                      <p className="muted">
                        {financials[0].month} through{' '}
                        {financials[financials.length - 1].month}
                      </p>
                      <div className="summary-line">
                        <span>Sample revenue</span>
                        <strong>{money(revenue)}</strong>
                      </div>
                      <div className="summary-line">
                        <span>Sample operating costs</span>
                        <strong>
                          {money(financials.reduce((n, r) => n + r.cost, 0))}
                        </strong>
                      </div>
                      <div className="summary-line">
                        <span>Sample operating margin</span>
                        <strong>
                          {money(
                            financials.reduce(
                              (n, r) => n + r.revenue - r.cost,
                              0,
                            ),
                          )}
                        </strong>
                      </div>
                      <p className="notice">
                        Date range filters financial records. Project and team
                        figures describe the current workspace across all dates.
                      </p>
                    </section>
                  </div>
                  <section className="panel">
                    <h2>Department performance</h2>
                    <div
                      className="table-scroll"
                      role="region"
                      aria-label="Scrollable records table"
                      tabIndex={0}
                    >
                      <table>
                        <thead>
                          <tr>
                            <th>Department</th>
                            <th>Active employees</th>
                            <th>Projects</th>
                            <th>Completed</th>
                            <th>Average progress</th>
                          </tr>
                        </thead>
                        <tbody>
                          {departments.map((d) => {
                            const ps = state.projects.filter(
                              (p) => p.department === d,
                            );
                            return (
                              <tr key={d}>
                                <td>{d}</td>
                                <td>
                                  {
                                    state.users.filter(
                                      (u) => u.department === d && u.active,
                                    ).length
                                  }
                                </td>
                                <td>{ps.length}</td>
                                <td>
                                  {
                                    ps.filter((p) => p.status === 'Completed')
                                      .length
                                  }
                                </td>
                                <td>
                                  {ps.length
                                    ? Math.round(
                                        ps.reduce((n, p) => n + p.progress, 0) /
                                          ps.length,
                                      )
                                    : 0}
                                  %
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}
              {page === 'Roles & permissions' && (
                <>
                  <div className="notice">
                    <ShieldCheck size={19} /> Simulated access control for
                    demonstration. Browser-side permissions do not provide
                    production security.
                  </div>
                  <section className="panel">
                    <div className="section-heading">
                      <div>
                        <h2>Preview an access level</h2>
                        <p>
                          Your selection controls editing across Employees and
                          Projects.
                        </p>
                      </div>
                      <select
                        aria-label="Preview role"
                        value={previewRole}
                        onChange={(e) => setPreviewRole(e.target.value)}
                      >
                        {roles.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div className="role-grid">
                      {roles.map((r) => (
                        <button
                          className={`role-card ${previewRole === r ? 'selected' : ''}`}
                          onClick={() => setPreviewRole(r)}
                          key={r}
                        >
                          <ShieldCheck size={24} />
                          <h3>{r}</h3>
                          <p>
                            {r === 'Administrator'
                              ? 'Workspace configuration, people, and projects.'
                              : r === 'Manager'
                                ? 'Manage employees and project delivery.'
                                : r === 'Team Member'
                                  ? 'Explore project and team information.'
                                  : 'Browse reports and workspace information.'}
                          </p>
                          <small>
                            {state.users.filter((u) => u.role === r).length}{' '}
                            employees assigned
                          </small>
                        </button>
                      ))}
                    </div>
                  </section>
                  <section className="panel">
                    <h2>Permission matrix</h2>
                    <div
                      className="table-scroll"
                      role="region"
                      aria-label="Scrollable records table"
                      tabIndex={0}
                    >
                      <table>
                        <thead>
                          <tr>
                            <th>Capability</th>
                            {roles.map((r) => (
                              <th key={r}>{r}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            'View workspace',
                            'Edit employees',
                            'Edit projects',
                            'Configure organization',
                          ].map((p, i) => (
                            <tr key={p}>
                              <td>{p}</td>
                              {roles.map((r, j) => (
                                <td key={r}>
                                  {i === 0 || j === 0 || (j === 1 && i < 3) ? (
                                    <span className="positive">Allowed</span>
                                  ) : (
                                    'View only'
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="muted">
                      Assign a role through an employee’s edit form. Preview
                      selection is independent from the demo administrator
                      profile.
                    </p>
                    <button onClick={() => go('Employees')}>
                      Manage role assignments <ArrowRight size={15} />
                    </button>
                  </section>
                </>
              )}
              {page === 'Activity' && (
                <div className="chart-grid">
                  <section className="panel">
                    <h2>Workspace timeline</h2>
                    {state.activities.map((a, i) => (
                      <div className="activity-row" key={a.id}>
                        <span className={`activity-icon mark-${i % 4}`}>
                          <Activity size={17} />
                        </span>
                        <div>
                          <strong>{a.text}</strong>
                          <small>
                            {new Date(a.date).toLocaleString('en-US')}
                          </small>
                        </div>
                      </div>
                    ))}
                  </section>
                  <section className="panel">
                    <div className="section-heading">
                      <h2>Notifications</h2>
                      <button
                        className="text-button"
                        onClick={() =>
                          commit(
                            {
                              ...state,
                              notifications: state.notifications.map((n) => ({
                                ...n,
                                read: true,
                              })),
                            },
                            'All notifications marked read',
                          )
                        }
                      >
                        Mark all read
                      </button>
                    </div>
                    {state.notifications.map((n) => (
                      <button
                        key={n.id}
                        className={`notification-row ${n.read ? 'read' : ''}`}
                        onClick={() =>
                          commit(
                            {
                              ...state,
                              notifications: state.notifications.map((v) =>
                                v.id === n.id ? { ...v, read: !v.read } : v,
                              ),
                            },
                            n.read ? 'Marked unread' : 'Marked read',
                          )
                        }
                      >
                        <Bell size={18} />
                        <span>
                          {n.text}
                          <small>
                            {n.read
                              ? 'Read · click to mark unread'
                              : 'Unread · click to mark read'}
                          </small>
                        </span>
                      </button>
                    ))}
                  </section>
                </div>
              )}
              {page === 'Settings' && (
                <div className="settings-grid">
                  <section className="panel">
                    <h2>Organization details</h2>
                    <p>
                      Fictional workspace information, saved in this browser.
                    </p>
                    <form
                      className="settings-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        const organization = String(
                          f.get('organization'),
                        ).trim();
                        if (organization.length < 2) {
                          setToast(
                            'Enter an organization name with at least two characters.',
                          );
                          return;
                        }
                        commit({
                          ...state,
                          settings: {
                            ...state.settings,
                            organization,
                          },
                        });
                      }}
                    >
                      <label>
                        Organization name
                        <input
                          name="organization"
                          defaultValue={state.settings.organization}
                          minLength={2}
                          maxLength={80}
                          required
                          disabled={previewRole !== 'Administrator'}
                        />
                      </label>
                      <label>
                        Workspace type
                        <input value="Interactive portfolio demo" readOnly />
                      </label>
                      <button
                        className="primary"
                        disabled={previewRole !== 'Administrator'}
                      >
                        Save organization
                      </button>
                    </form>
                  </section>
                  <section className="panel">
                    <h2>Display preferences</h2>
                    <label>
                      Color theme
                      <select
                        aria-label="Color theme"
                        value={state.settings.theme}
                        onChange={(e) =>
                          commit({
                            ...state,
                            settings: {
                              ...state.settings,
                              theme: e.target.value as 'light' | 'dark',
                            },
                          })
                        }
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </label>
                    <label>
                      Rows per page
                      <select
                        aria-label="Rows per page"
                        value={pageSize}
                        onChange={(e) => {
                          setIndex(1);
                          commit({
                            ...state,
                            settings: {
                              ...state.settings,
                              pageSize: Number(e.target.value),
                            },
                          });
                        }}
                      >
                        {[5, 10, 20].map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                    <p className="muted">
                      Preferences and edits are stored only in your current
                      browser. They are not shared with other visitors.
                    </p>
                  </section>
                  <section className="panel danger-panel">
                    <h2>A fresh start</h2>
                    <p>
                      Restore all original fictional records and display
                      preferences. This replaces your local edits.
                    </p>
                    <button className="danger" onClick={reset}>
                      Reset Demo Data
                    </button>
                  </section>
                  <section className="panel">
                    <CircleHelp size={24} />
                    <h2>Made for exploration</h2>
                    <p>
                      No backend, credentials, email, or production
                      authentication. Every workflow runs on your device.
                    </p>
                    <button onClick={() => go('About this project')}>
                      About this project <ArrowUpRight size={16} />
                    </button>
                  </section>
                </div>
              )}
              {page === 'About this project' && (
                <>
                  <section className="panel about-hero">
                    <span className="eyebrow">
                      INDEPENDENT DESIGN & ENGINEERING
                    </span>
                    <h2>
                      Business software.
                      <br />
                      Thoughtfully connected.
                    </h2>
                    <p>
                      Business Admin Dashboard is an independently built
                      portfolio demonstration of a modern operations workspace.
                      Northstar Operations, its employees, projects, and
                      financial records are fictional. This is not client work.
                    </p>
                  </section>
                  <div className="settings-grid">
                    {[
                      {
                        title: 'Preview the cost of a decision',
                        text: 'The delivery planner compares remaining work with shared weekday capacity. Preview a staffing transfer or deadline change, see which other projects lose capacity, record your rationale, and apply or safely undo the decision. The calculations are visible estimates, not delivery guarantees.',
                      },
                      {
                        title: 'A practical business problem',
                        text: 'Scattered employee records, unclear project ownership, and disconnected reporting make daily operations harder. This demo brings those workflows into a consistent, accessible interface.',
                      },
                      {
                        title: 'What you can try',
                        text: 'Create and edit employees and projects, assign departments and roles, update delivery status, filter records, export sample financial reports, mark notifications read, and personalize your workspace.',
                      },
                      {
                        title: 'Frontend architecture',
                        text: 'Next.js App Router, strict TypeScript, React, Tailwind CSS, Lucide, Recharts, React Hook Form, Zod, and Radix dialogs. Typed fixtures feed Promise-based mock services. Validated localStorage keeps changes across visits.',
                      },
                      {
                        title: 'Clear limits',
                        text: 'Demo entry and permission previews are simulations. No production backend, authentication service, database, email, or shared storage is connected. Financial values are samples in USD. Use fictional details only.',
                      },
                    ].map((c) => (
                      <section className="panel" key={c.title}>
                        <h2>{c.title}</h2>
                        <p>{c.text}</p>
                      </section>
                    ))}
                  </div>
                </>
              )}
              <footer className="workspace-footer">
                <span>
                  <span className="live-dot" /> All systems local
                </span>
                <span>Independent portfolio demo · All data fictional</span>
                <button
                  className="text-button"
                  onClick={() => go('About this project')}
                >
                  About this project <ArrowUpRight size={12} />
                </button>
              </footer>
            </main>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast('')}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {user && (
        <Modal
          title={
            state.users.some((u) => u.id === user.id)
              ? 'Edit employee'
              : 'Add employee'
          }
          onClose={() => setUser(null)}
        >
          <UserForm user={user} onSave={saveUser} />
        </Modal>
      )}
      {project && (
        <Modal
          title={
            state.projects.some((p) => p.id === project.id)
              ? 'Edit project'
              : 'New project'
          }
          onClose={() => setProject(null)}
        >
          <ProjectForm
            project={project}
            users={state.users}
            onSave={saveProject}
          />
        </Modal>
      )}
      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <dl className="detail-list">
            {'email' in detail ? (
              <>
                <dt>Email</dt>
                <dd>{detail.email}</dd>
                <dt>Department</dt>
                <dd>{detail.department}</dd>
                <dt>Role</dt>
                <dd>{detail.role}</dd>
                <dt>Status</dt>
                <dd>{detail.active ? 'Active' : 'Inactive'}</dd>
              </>
            ) : (
              <>
                <dt>Department</dt>
                <dd>{detail.department}</dd>
                <dt>Status</dt>
                <dd>{detail.status}</dd>
                <dt>Priority</dt>
                <dd>{detail.priority}</dd>
                <dt>Schedule</dt>
                <dd>
                  {detail.start} → {detail.due}
                </dd>
                <dt>Progress</dt>
                <dd>
                  {detail.progress}% · {detail.tasks} tasks
                </dd>
                <dt>Assigned team</dt>
                <dd>
                  {detail.assignees
                    .map((id) => state.users.find((u) => u.id === id)?.name)
                    .join(', ')}
                </dd>
              </>
            )}
          </dl>
          <button
            className="primary"
            disabled={!canEdit}
            onClick={() => {
              if ('email' in detail) setUser(detail);
              else setProject(detail);
              setDetail(null);
            }}
          >
            Edit record
          </button>
        </Modal>
      )}
      {confirm && (
        <Modal title="Confirm change" onClose={() => setConfirm(null)}>
          <p>{confirm.title}</p>
          <div className="dialog-actions">
            <button onClick={() => setConfirm(null)}>Cancel</button>
            <button className="danger" onClick={confirm.action}>
              Confirm
            </button>
          </div>
        </Modal>
      )}
      {notifications && (
        <Modal title="Notifications" onClose={() => setNotifications(false)}>
          {state.notifications.map((n) => (
            <button
              className={`notification-row ${n.read ? 'read' : ''}`}
              key={n.id}
              onClick={() =>
                commit({
                  ...state,
                  notifications: state.notifications.map((v) =>
                    v.id === n.id ? { ...v, read: !v.read } : v,
                  ),
                })
              }
            >
              <Bell size={18} />
              <span>
                {n.text}
                <small>{n.read ? 'Read' : 'Unread'} · click to toggle</small>
              </span>
            </button>
          ))}
        </Modal>
      )}
    </>
  );
}
