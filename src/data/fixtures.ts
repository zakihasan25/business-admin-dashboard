import { departments, roles, statuses, type DemoState } from '@/lib/model';
const first = [
  'Avery',
  'Rowan',
  'Ellis',
  'Morgan',
  'Quinn',
  'Reese',
  'Sage',
  'Emery',
];
const last = ['Vale', 'Ashford', 'Wren', 'Hartwell', 'Finch'];
const projectNames = [
  'Customer portal redesign',
  'Operations playbook',
  'Analytics workspace',
  'Brand refresh',
  'Quarterly financial review',
  'Partner onboarding',
  'Workflow automation',
  'Knowledge center',
  'Service quality program',
  'Campaign launch',
  'Resource planning',
  'Billing experience',
  'Design system',
  'Market research',
  'Platform migration',
  'Team enablement',
  'Vendor assessment',
  'Annual planning',
  'Support toolkit',
  'Website optimization',
];
export function fixtures(): DemoState {
  return {
    version: 1,
    users: Array.from({ length: 40 }, (_, i) => ({
      id: `usr-${i + 1}`,
      name: `${first[i % 8]} ${last[Math.floor(i / 8)]}`,
      email: `${first[i % 8].toLowerCase()}.${last[Math.floor(i / 8)].toLowerCase()}@northstar.example`,
      department: departments[i % 5],
      role: roles[i === 0 ? 0 : i % 9 === 0 ? 1 : i % 7 === 0 ? 3 : 2],
      active: i % 11 !== 0,
      capacityHoursPerDay: 6,
    })),
    projects: projectNames.map((name, i) => ({
      id: `prj-${i + 1}`,
      name,
      department: departments[i % 5],
      status: statuses[i % 4],
      priority: i % 3 === 0 ? 'High' : i % 3 === 1 ? 'Medium' : 'Low',
      start: '2026-07-01',
      due: `2026-${i % 4 === 3 ? '09' : '10'}-${String(20 + (i % 9)).padStart(2, '0')}`,
      progress: i % 4 === 3 ? 100 : i % 4 === 0 ? 10 : 35 + (i % 5) * 10,
      assignees: [`usr-${i + 1}`, `usr-${i + 6}`],
      tasks: 12 + i,
      estimatedHours: (12 + i) * 4,
    })),
    financials: Array.from({ length: 12 }, (_, i) => ({
      month: `2026-${String(i + 1).padStart(2, '0')}`,
      revenue: 42000 + i * 3400 + (i % 3) * 2700,
      cost: 28000 + i * 1700,
    })),
    activities: [
      {
        id: 'act-1',
        text: 'Customer portal redesign moved into planning',
        date: '2026-10-19T09:00:00Z',
      },
      {
        id: 'act-2',
        text: 'Brand refresh completed by the Marketing team',
        date: '2026-10-18T14:30:00Z',
      },
      {
        id: 'act-3',
        text: 'October operations review prepared',
        date: '2026-10-18T10:00:00Z',
      },
    ],
    notifications: [
      {
        id: 'note-1',
        text: '7 projects have high priority. Review upcoming deadlines.',
        read: false,
      },
      {
        id: 'note-2',
        text: 'Sample October financial report is ready to explore.',
        read: false,
      },
      {
        id: 'note-3',
        text: 'Welcome to your independent portfolio demo.',
        read: true,
      },
    ],
    settings: {
      organization: 'Northstar Operations',
      theme: 'light',
      pageSize: 5,
    },
  };
}
