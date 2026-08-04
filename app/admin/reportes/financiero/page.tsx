'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { DateRangePicker, QuickDateFilters } from '@/components/reports/DateRangePicker';
import { SummaryCards } from '@/components/reports/SummaryCards';
import { ExportButtons } from '@/components/reports/ExportButtons';
import { LineChartCard, PieChartCard } from '@/components/reports/ReportCharts';

function formatBs(v: number) { return v.toLocaleString('es-VE', { minimumFractionDigits: 2 }) + ' Bs'; }

export default function EstadoFinancieroPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [egresos, setEgresos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({ type: 'financiero' });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    try {
      const res = await fetch(`/api/reportes?${params}`);
      const d = await res.json();
      if (d.success) { setSummary(d.summary); setIngresos(d.ingresos || []); setEgresos(d.egresos || []); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [from, to]);

  const egresoByClasificacion: Record<string, number> = {};
  egresos.forEach((r: any) => { egresoByClasificacion[r.clasificacionGasto] = (egresoByClasificacion[r.clasificacionGasto] || 0) + Number(r.montoBs || 0); });

  const ingresoByBanco: Record<string, number> = {};
  ingresos.forEach((r: any) => { ingresoByBanco[r.banco] = (ingresoByBanco[r.banco] || 0) + Number(r.precioBs || 0); });

  const excelData = {
    title: 'Estado Financiero',
    columns: ['Concepto', 'Monto (Bs)'],
    data: [
      ['Total Ingresos', summary?.totalIngresos || 0],
      ['Total Egresos', summary?.totalEgresos || 0],
      ['Balance', summary?.balance || 0],
    ],
  };

  const balanceColor = (summary?.balance || 0) >= 0 ? 'text-emerald-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Estado Financiero</h1>
          <p className="text-sm text-slate-500">Balance de ingresos vs egresos con gráficos</p>
        </div>
        <ExportButtons excelData={excelData} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
        <QuickDateFilters onChange={(f, t) => { setFrom(f); setTo(t); }} />
      </div>

      {summary && (
        <>
          <SummaryCards cards={[
            { label: 'Total Ingresos', value: formatBs(summary.totalIngresos), icon: <TrendingUp size={18} className="text-emerald-600" />, color: 'bg-emerald-50' },
            { label: 'Total Egresos', value: formatBs(summary.totalEgresos), icon: <TrendingDown size={18} className="text-red-600" />, color: 'bg-red-50' },
            { label: 'Balance', value: formatBs(summary.balance), icon: <Activity size={18} className="text-blue-600" />, color: summary.balance >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
          ]} />

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">BALANCE NETO</p>
                <p className={`text-3xl font-black ${balanceColor}`}>{formatBs(summary.balance)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">{summary.countIngresos} ingresos · {summary.countEgresos} egresos</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChartCard
              title="Ingresos vs Egresos"
              data={[{ name: 'Período', ingresos: summary.totalIngresos, egresos: summary.totalEgresos }]}
              lines={['ingresos', 'egresos']}
            />
            <PieChartCard title="Distribución de Egresos" data={egresoByClasificacion} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-emerald-50">
                <h3 className="text-sm font-bold text-emerald-800">Ingresos por Banco</h3>
              </div>
              <div className="p-4 space-y-2">
                {Object.entries(ingresoByBanco).map(([banco, monto]) => (
                  <div key={banco} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-700">{banco}</span>
                    <span className="text-sm font-bold text-emerald-700">{formatBs(Number(monto))}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-red-50">
                <h3 className="text-sm font-bold text-red-800">Egresos por Clasificación</h3>
              </div>
              <div className="p-4 space-y-2">
                {Object.entries(egresoByClasificacion).map(([clas, monto]) => (
                  <div key={clas} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-700">{clas}</span>
                    <span className="text-sm font-bold text-red-700">{formatBs(Number(monto))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
