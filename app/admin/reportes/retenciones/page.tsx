'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Shield, Users, Percent } from 'lucide-react';
import { DateRangePicker, QuickDateFilters } from '@/components/reports/DateRangePicker';
import { SummaryCards } from '@/components/reports/SummaryCards';
import { ExportButtons } from '@/components/reports/ExportButtons';
import { BarChartCard, PieChartCard } from '@/components/reports/ReportCharts';

function formatBs(v: number) { return v.toLocaleString('es-VE', { minimumFractionDigits: 2 }) + ' Bs'; }

export default function ReporteRetencionesPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({ type: 'retenciones' });
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
    title: 'Reporte de Retenciones',
    columns: ['Fecha', 'Cliente', 'RIF', 'Factura N°', 'Monto Retenido', '% Retención'],
    data: data.map(r => [
      r.fecha ? new Date(r.fecha).toLocaleDateString('es-VE') : '—',
      r.cliente_nombre || '—',
      r.cliente_rif || '—',
      `F-${r.factura_id}`,
      Number(r.monto_retenido),
      Number(r.porcentaje_retencion || 75),
    ]),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reporte de Retenciones</h1>
          <p className="text-sm text-slate-500">Detalle de retenciones de IVA por cliente y período</p>
        </div>
        <ExportButtons excelData={excelData} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
        <QuickDateFilters onChange={(f, t) => { setFrom(f); setTo(t); }} />
      </div>

      {summary && (
        <SummaryCards cards={[
          { label: 'Total Retenido', value: formatBs(summary.totalRetenido), icon: <DollarSign size={18} className="text-red-600" />, color: 'bg-red-50' },
          { label: 'Retenciones', value: summary.count, icon: <Shield size={18} className="text-purple-600" />, color: 'bg-purple-50' },
          { label: 'Clientes', value: Object.keys(summary.byCliente).length, icon: <Users size={18} className="text-blue-600" />, color: 'bg-blue-50' },
        ]} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {summary && <BarChartCard title="Retenciones por Cliente" data={summary.byCliente} />}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Detalle de Retenciones</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Cliente</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">RIF</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Factura</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Monto Retenido</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">% Ret.</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Cargando...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Sin datos para el período seleccionado</td></tr>
              ) : data.map((r, i) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{r.fecha ? new Date(r.fecha).toLocaleDateString('es-VE') : '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{r.cliente_nombre}</td>
                  <td className="px-4 py-3 text-slate-700">{r.cliente_rif}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">F-{r.factura_id}</td>
                  <td className="px-4 py-3 text-right font-medium text-red-600">{formatBs(Number(r.monto_retenido))}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{Number(r.porcentaje_retencion || 75)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
