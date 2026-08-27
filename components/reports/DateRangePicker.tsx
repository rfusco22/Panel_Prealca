'use client';

import { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { aISOLocal } from '@/lib/fecha';
interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-2">
        <Calendar size={15} className="text-slate-400" />
        <input
          type="date"
          value={from}
          onChange={e => onChange(e.target.value, to)}
          className="text-sm text-slate-700 outline-none bg-transparent font-medium"
        />
      </div>
      <span className="text-slate-400 text-sm">a</span>
      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-2">
        <Calendar size={15} className="text-slate-400" />
        <input
          type="date"
          value={to}
          onChange={e => onChange(from, e.target.value)}
          className="text-sm text-slate-700 outline-none bg-transparent font-medium"
        />
      </div>
      {(from || to) && (
        <button
          onClick={() => onChange('', '')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          title="Limpiar filtros"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

export function QuickDateFilters({ onChange }: { onChange: (from: string, to: string) => void }) {
  const today = new Date();
  // aISOLocal usa los componentes locales. Con toISOString() el "1 del mes" a
  // medianoche local se convertía al último día del mes anterior en UTC-4, así
  // que "Este mes" y "Mes pasado" arrancaban un día antes.
  const fmt = (d: Date) => aISOLocal(d);

  const presets = [
    { label: 'Hoy', from: fmt(today), to: fmt(today) },
    { label: 'Últimos 7 días', from: fmt(new Date(today.getTime() - 7 * 86400000)), to: fmt(today) },
    { label: 'Últimos 30 días', from: fmt(new Date(today.getTime() - 30 * 86400000)), to: fmt(today) },
    { label: 'Este mes', from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), to: fmt(today) },
    { label: 'Mes pasado', from: fmt(new Date(today.getFullYear(), today.getMonth() - 1, 1)), to: fmt(new Date(today.getFullYear(), today.getMonth(), 0)) },
    { label: 'Este año', from: `${today.getFullYear()}-01-01`, to: fmt(today) },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map(p => (
        <button
          key={p.label}
          onClick={() => onChange(p.from, p.to)}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
