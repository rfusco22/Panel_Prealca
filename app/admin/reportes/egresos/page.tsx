'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingDown, Tag, Building2 } from 'lucide-react';
import { DateRangePicker, QuickDateFilters } from '@/components/reports/DateRangePicker';
import { SummaryCards } from '@/components/reports/SummaryCards';
import { ExportButtons } from '@/components/reports/ExportButtons';
import { BarChartCard, PieChartCard } from '@/components/reports/ReportCharts';

function formatBs(v: number) { return v.toLocaleString('es-VE', { minimumFractionDigits: 2 }) + ' Bs'; }

export default function ReporteEgresosPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({ type: 'egresos' });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    try {
      const res = await fetch(`/api/reportes?${params}`);
      const d = await res.json();
      if (d.success) { setData(d.data); setSummary(d.summary); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [from, to]);

  const excelData = {
    title: 'Reporte de Egresos',
    columns: ['Fecha', 'Banco', 'Proveedor', 'Clasificación', 'Subcategoría', 'Monto (Bs)', 'Monto ($)', 'Referencia'],
    data: data.map(r => [r.fecha || '', r.banco, r.nombreProveedor, r.clasificacionGasto, r.subCategoria || '', Number(r.montoBs), Number(r.montoDivisa), r.referencia]),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reporte de Egresos</h1>
          <p className="text-sm text-slate-500">Análisis de gastos por clasificación, tipo y proveedor</p>
        </div>
        <ExportButtons excelData={excelData} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
        <QuickDateFilters onChange={(f, t) => { setFrom(f); setTo(t); }} />
      </div>

      {summary && (
        <SummaryCards cards={[
          { label: 'Total Egresos', value: formatBs(summary.totalBs), icon: <DollarSign size={18} className="text-red-600" />, color: 'bg-red-50' },
          { label: 'Total Divisa', value: '$' + summary.totalDivisa.toLocaleString('en-US', { minimumFractionDigits: 2 }), icon: <DollarSign size={18} className="text-blue-600" />, color: 'bg-blue-50' },
          { label: 'Registros', value: summary.count, icon: <TrendingDown size={18} className="text-orange-600" />, color: 'bg-orange-50' },
        ]} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {summary && <BarChartCard title="Egresos por Clasificación" data={summary.byClasificacion} />}
        {summary && <PieChartCard title="Distribución por Banco" data={summary.byBanco} />}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Detalle de Egresos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Banco</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Proveedor</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Clasificación</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Monto (Bs)</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Monto ($)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Cargando...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Sin datos para el período seleccionado</td></tr>
              ) : data.map((r, i) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{r.fecha || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{r.banco}</td>
                  <td className="px-4 py-3 text-slate-700">{r.nombreProveedor}</td>
                  <td className="px-4 py-3 text-slate-700">{r.clasificacionGasto}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">{formatBs(Number(r.montoBs))}</td>
                  <td className="px-4 py-3 text-right text-slate-700">${Number(r.montoDivisa).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
