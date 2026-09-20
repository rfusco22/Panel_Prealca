'use client';

import { useState, useEffect } from 'react';
import { Truck, Gauge, Users, AlertTriangle, ArrowLeft, HardHat } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DateRangePicker, QuickDateFilters } from '@/components/reports/DateRangePicker';
import { SummaryCards } from '@/components/reports/SummaryCards';
import { ExportButtons } from '@/components/reports/ExportButtons';
import { BarChartCard } from '@/components/reports/ReportCharts';
import { diasHasta } from '@/lib/fecha';

// El selector arranca con un solo reporte a propósito: los otros cinco
// (m³, resistencia, clientes, materia prima, comisiones) se van sumando acá
// a medida que se implementen, sin crear una página nueva por cada uno.
// Ver issue #7.
const REPORTES = [
  { id: 'viajes', label: 'Viajes por trompero' },
];

function ViajesPorTrompero({ from, to }: { from: string; to: string }) {
  const [data, setData] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const params = new URLSearchParams({ type: 'viajes' });
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      try {
        const res = await fetch(`/api/reportes?${params}`);
        const d = await res.json();
        if (d.success) {
          setData(d.data || []);
          setUnidades(d.unidades || []);
          setSummary(d.summary);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchData();
  }, [from, to]);

  const excelData = {
    title: 'Viajes por trompero',
    columns: ['Chofer', 'Cédula', 'Viajes', 'M³ Total', 'Promedio M³', 'Unidades'],
    data: data.map(r => [
      r.chofer || 'Sin chofer',
      r.cedula || '—',
      r.viajes,
      Number(r.totalM3).toFixed(2),
      Number(r.promedioM3).toFixed(2),
      r.unidadesDistintas,
    ]),
  };

  // Cruce con la ficha del chofer, que recién es posible desde que la guía
  // guarda chofer_id: si maneja con la licencia o el certificado vencido, se
  // muestra acá al lado de sus viajes.
  const documentoVencido = (fecha: string | null) => {
    if (!fecha) return null;
    const dias = diasHasta(fecha);
    if (dias === null) return null;
    if (dias < 0) return { texto: `vencido hace ${Math.abs(dias)}d`, clase: 'bg-red-100 text-red-700' };
    if (dias <= 30) return { texto: `vence en ${dias}d`, clase: 'bg-amber-100 text-amber-700' };
    return null;
  };

  if (loading) {
    return <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">Cargando viajes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportButtons excelData={excelData} />
      </div>

      {summary && (
        <SummaryCards cards={[
          { label: 'Total Viajes', value: summary.totalViajes, icon: <Truck size={18} className="text-blue-600" />, color: 'bg-blue-50' },
          { label: 'Total M³', value: Number(summary.totalM3).toFixed(2), icon: <Gauge size={18} className="text-emerald-600" />, color: 'bg-emerald-50' },
          { label: 'Choferes', value: summary.choferes, icon: <Users size={18} className="text-purple-600" />, color: 'bg-purple-50' },
          { label: 'Promedio M³/viaje', value: Number(summary.promedioM3).toFixed(2), icon: <Gauge size={18} className="text-slate-600" />, color: 'bg-slate-50' },
        ]} />
      )}

      {summary?.sinVincular > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Hay <strong>{summary.sinVincular} viaje(s)</strong> de guías cuyo chofer no quedó vinculado a una ficha.
            Aparecen igual en la lista, pero conviene asignarles el chofer para que el conteo quede completo.
          </p>
        </div>
      )}

      {summary && <BarChartCard title="Viajes por chofer" data={summary.viajesPorChofer} />}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Detalle por chofer</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Chofer</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Cédula</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Viajes</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">M³ Total</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Prom. M³</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Unidades</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Documentos</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Sin viajes en el período seleccionado</td></tr>
              ) : data.map((r, i) => {
                const licencia = documentoVencido(r.licenciaVencimiento);
                const certificado = documentoVencido(r.certificadoVencimiento);
                return (
                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <HardHat size={14} className="text-slate-400 shrink-0" />
                        {r.chofer || 'Sin chofer'}
                        {r.choferId === null && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">sin vincular</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{r.cedula || '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">{r.viajes}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{Number(r.totalM3).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{Number(r.promedioM3).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{r.unidadesDistintas}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {licencia && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${licencia.clase}`}>Licencia {licencia.texto}</span>}
                        {certificado && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${certificado.clase}`}>Cert. médico {certificado.texto}</span>}
                        {!licencia && !certificado && r.choferId !== null && <span className="text-xs text-slate-400">En regla</span>}
                        {r.choferId === null && <span className="text-xs text-slate-400">—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Viajes por unidad</h3>
          <p className="text-xs text-slate-400 mt-0.5">Para cruzar con el mantenimiento de la flota</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Unidad</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Placa</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Viajes</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">M³ Total</th>
              </tr>
            </thead>
            <tbody>
              {unidades.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Sin datos para el período seleccionado</td></tr>
              ) : unidades.map((u, i) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {u.numeroUnidad ? `#${u.numeroUnidad}` : <span className="text-slate-400">Sin unidad asignada</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{u.placa || '—'}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{u.viajes}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{Number(u.totalM3).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ReportesOperativosPage() {
  const backHref = usePathname().replace(/\/operativos\/?$/, '');
  const [reporte, setReporte] = useState('viajes');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={backHref} className="p-2 hover:bg-slate-100 rounded-lg transition">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div className="p-2.5 bg-cyan-50 rounded-xl"><Truck className="w-5 h-5 text-cyan-600" /></div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reportes Operativos</h1>
          <p className="text-xs text-slate-500">Producción y despacho · Filtros por período</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reporte</label>
          <select
            value={reporte}
            onChange={e => setReporte(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-800 bg-white min-w-[220px]"
          >
            {REPORTES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>
        <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
        <QuickDateFilters onChange={(f, t) => { setFrom(f); setTo(t); }} />
      </div>

      {reporte === 'viajes' && <ViajesPorTrompero from={from} to={to} />}
    </div>
  );
}
