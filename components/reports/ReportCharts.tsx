'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';

const COLORS = ['#1e3a5f', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

interface BarChartCardProps {
  title: string;
  data: Record<string, number>;
  xAxisKey?: string;
  yAxisKey?: string;
}

export function BarChartCard({ title, data }: BarChartCardProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + '...' : name, value }));

  if (chartData.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => Number(v).toLocaleString('es-VE', { minimumFractionDigits: 2 })} />
          <Bar dataKey="value" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PieChartCardProps {
  title: string;
  data: Record<string, number>;
}

export function PieChartCard({ title, data }: PieChartCardProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));

  if (chartData.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => Number(v).toLocaleString('es-VE', { minimumFractionDigits: 2 })} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface LineChartCardProps {
  title: string;
  data: Array<{ name: string; ingresos?: number; egresos?: number; value?: number }>;
  lines?: string[];
}

export function LineChartCard({ title, data, lines = ['value'] }: LineChartCardProps) {
  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => Number(v).toLocaleString('es-VE', { minimumFractionDigits: 2 })} />
          <Legend />
          {lines.includes('ingresos') && <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />}
          {lines.includes('egresos') && <Line type="monotone" dataKey="egresos" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />}
          {lines.includes('value') && <Line type="monotone" dataKey="value" stroke="#1e3a5f" strokeWidth={2} dot={{ r: 3 }} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
