'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Droplets, Receipt } from 'lucide-react';
import { DateRangePicker, QuickDateFilters } from '@/components/reports/DateRangePicker';
import { SummaryCards } from '@/components/reports/SummaryCards';
import { ExportButtons } from '@/components/reports/ExportButtons';
import { BarChartCard, PieChartCard } from '@/components/reports/ReportCharts';
import { formatearFecha } from '@/lib/fecha';

function formatBs(v: number) { return v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Bs'; }

export default function ReporteIngresosPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<any[]>([]);
  // Pestaña Premezclado / Prealca. Filtra del lado del cliente sobre lo que ya
  // trajo el reporte: los totales de arriba siguen siendo los del período
  // completo y la pestaña solo recorta el detalle.
  const [tipo, setTipo] = useState<'TODOS' | 'PREMEZCLADO' | 'PREALCA'>('TODOS');
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({ type: 'ingresos' });
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

  const filas = tipo === 'TODOS' ? data : data.filter(r => (r.tipo || '').toUpperCase() === tipo);

  const etiquetaTipo = (valor: unknown) => {
    const t = typeof valor === 'string' ? valor.toUpperCase() : '';
    if (t === 'PREALCA') return 'Prealca';
    if (t === 'PREMEZCLADO') return 'Premezclado';
    // Los ingresos cargados antes de que existiera la columna no tienen tipo.
    return '—';
  };

  const PESTANAS: Array<{ valor: 'TODOS' | 'PREMEZCLADO' | 'PREALCA'; texto: string }> = [
    { valor: 'TODOS', texto: 'Todos' },
    { valor: 'PREMEZCLADO', texto: 'Premezclado' },
    { valor: 'PREALCA', texto: 'Prealca' },
  ];

  const excelData = {
    title: 'Reporte de Ingresos',
    columns: ['Fecha', 'Tipo', 'Banco', 'Cliente', 'Vendedor', 'M³', 'Monto (Bs)', 'Monto ($)', 'IVA'],
    data: filas.map(r => [formatearFecha(r.createdAt || r.fecha), etiquetaTipo(r.tipo), r.banco, r.nombreCliente, r.vendedor, r.m3 || 0, Number(r.precioBs), Number(r.precioDivisa), Number(r.montoIva || 0)]),
  };

  return (
    <div className="aparecer space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reporte de Ingresos</h1>
          <p className="text-sm text-slate-500">Análisis detallado de ingresos por período, banco y vendedor</p>
        </div>
        <ExportButtons excelData={excelData} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
        <QuickDateFilters onChange={(f, t) => { setFrom(f); setTo(t); }} />
      </div>

      {summary && (
        <SummaryCards cards={[
          { label: 'Total Ingresos', value: formatBs(summary.totalBs), icon: <DollarSign size={18} className="text-emerald-600" />, color: 'bg-emerald-50' },
          { label: 'Total Divisa', value: '$' + summary.totalDivisa.toLocaleString('en-US', { minimumFractionDigits: 2 }), icon: <DollarSign size={18} className="text-blue-600" />, color: 'bg-blue-50' },
          { label: 'Total M³', value: summary.totalM3.toFixed(2), icon: <Droplets size={18} className="text-cyan-600" />, color: 'bg-cyan-50' },
          { label: 'Total IVA', value: formatBs(summary.totalIva), icon: <Receipt size={18} className="text-purple-600" />, color: 'bg-purple-50' },
          { label: 'Registros', value: summary.count, icon: <TrendingUp size={18} className="text-orange-600" />, color: 'bg-orange-50' },
        ]} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {summary && <BarChartCard title="Ingresos por Banco" data={summary.byBanco} />}
        {summary && <PieChartCard title="Distribución por Vendedor" data={summary.byVendedor} />}
      </div>

      <div className="superficie overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900">Detalle de Ingresos</h3>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {PESTANAS.map(p => {
              const cuantos = p.valor === 'TODOS' ? data.length : data.filter(r => (r.tipo || '').toUpperCase() === p.valor).length;
              return (
                <button
                  key={p.valor}
                  type="button"
                  onClick={() => setTipo(p.valor)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${tipo === p.valor ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {p.texto} <span className="font-semibold text-slate-400">({cuantos})</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Tipo</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Banco</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Cliente</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Vendedor</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">M³</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Monto (Bs)</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Monto ($)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Cargando...</td></tr>
              ) : filas.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Sin datos para el período seleccionado</td></tr>
              ) : filas.map((r, i) => (
                <tr key={i} className="border-t border-slate-100 fila-interactiva">
                  {/* createdAt es la fecha del ingreso; los registros viejos
                      la traen en fecha. Misma lectura que la tabla de Ingresos. */}
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatearFecha(r.createdAt || r.fecha)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      (r.tipo || '').toUpperCase() === 'PREALCA'
                        ? 'bg-blue-50 text-blue-700'
                        : (r.tipo || '').toUpperCase() === 'PREMEZCLADO'
                          ? 'bg-purple-50 text-purple-700'
                          : 'text-slate-400'
                    }`}>
                      {etiquetaTipo(r.tipo)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.banco}</td>
                  <td className="px-4 py-3 text-slate-700">{r.nombreCliente}</td>
                  <td className="px-4 py-3 text-slate-700">{r.vendedor}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{Number(r.m3 || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">{formatBs(Number(r.precioBs))}</td>
                  <td className="px-4 py-3 text-right text-slate-700">${Number(r.precioDivisa).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
