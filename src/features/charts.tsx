'use client';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
export function RevenueChart({
  data,
}: {
  data: { month: string; revenue: number; cost: number }[];
}) {
  return (
    <div
      className="chart"
      role="img"
      aria-label="Sample revenue and operating costs in US dollars. Values are available in the report CSV."
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 12, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#15967d" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#15967d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 5"
            vertical={false}
            stroke="var(--line)"
          />
          <XAxis
            dataKey="month"
            tickFormatter={(v) =>
              new Date(`${v}-02`).toLocaleString('en-US', { month: 'short' })
            }
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'var(--muted)' }}
          />
          <YAxis
            tickFormatter={(v) => `${v / 1000}k`}
            axisLine={false}
            tickLine={false}
            width={42}
            tick={{ fontSize: 11, fill: 'var(--muted)' }}
          />
          <Tooltip
            formatter={(v) => `$${Number(v).toLocaleString()}`}
            contentStyle={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 10,
            }}
          />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="cost"
            stroke="#9daeb9"
            strokeDasharray="5 5"
            fill="transparent"
            strokeWidth={2}
          />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="revenue"
            stroke="#15967d"
            fill="url(#revenueFill)"
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function WorkloadChart({
  data,
}: {
  data: { name: string; projects: number }[];
}) {
  return (
    <div
      className="chart"
      role="img"
      aria-label="Project workload by department"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: 'var(--muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            width={25}
          />
          <Tooltip contentStyle={{ background: 'var(--panel)' }} />
          <Bar
            isAnimationActive={false}
            dataKey="projects"
            fill="#15967d"
            radius={[5, 5, 0, 0]}
            maxBarSize={42}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
