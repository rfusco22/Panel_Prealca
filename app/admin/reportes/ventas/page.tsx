'use client';

import { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, Users, CreditCard } from 'lucide-react';
import { DateRangePicker, QuickDateFilters } from '@/components/reports/DateRangePicker';
import { SummaryCards } from '@/components/reports/SummaryCards';
import { ExportButtons } from '@/components/reports/ExportButtons';
import { BarChartCard, PieChartCard } from '@/components/reports/ReportCharts';

function formatBs(v: number) { return v.toLocaleString('es-VE', { minimumFractionDigits: 2 }) + ' Bs'; }

export default function ReporteVentasPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({ type: 'ventas' });
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
    title: 'Reporte de Ventas',
    columns: ['N° Factura', 'Fecha', 'Cliente', 'Forma Pago', 'Total'],
    data: data.map(r => [`F-${r.id}`, r.fecha ? new Date(r.fecha).toLocaleDateString('es-VE') : '—', r.clienteNombre || '—', r.formaPago, Number(r.total)]),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reporte de Ventas</h1>
          <p className="text-sm text-slate-500">Estadísticas de facturas emitidas y productos vendidos</p>
        </div>
        <ExportButtons excelData={excelData} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
        <QuickDateFilters onChange={(f, t) => { setFrom(f); setTo(t); }} />
      </div>

      {summary && (
        <SummaryCards cards={[
          { label: 'Total Ventas', value: formatBs(summary.totalBs), icon: <DollarSign size={18} className="text-emerald-600" />, color: 'bg-emerald-50' },
          { label: 'Facturas', value: summary.count, icon: <ShoppingCart size={18} className="text-blue-600" />, color: 'bg-blue-50' },
          { label: 'Clientes', value: Object.keys(summary.byCliente).length, icon: <Users size={18} className="text-purple-600" />, color: 'bg-purple-50' },
        ]} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {summary && <BarChartCard title="Ventas por Cliente" data={summary.byCliente} />}
        {summary && <PieChartCard title="Forma de Pago" data={summary.byFormaPago} />}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Detalle de Facturas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">N° Factura</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Cliente</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Forma Pago</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Cargando...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Sin datos para el período seleccionado</td></tr>
              ) : data.map((r, i) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">F-{r.id}</td>
                  <td className="px-4 py-3 text-slate-700">{r.fecha ? new Date(r.fecha).toLocaleDateString('es-VE') : '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{r.clienteNombre || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{r.formaPago}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">{formatBs(Number(r.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
