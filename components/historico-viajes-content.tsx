'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { History, Loader2, Truck, Route, Package, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useSocket } from '@/contexts/SocketContext';
import { DateRangePicker } from '@/components/reports/DateRangePicker';
import { ExportButtons } from '@/components/reports/ExportButtons';
import { SummaryCards } from '@/components/reports/SummaryCards';
import { formatearFechaCorta, hoyLocal, hoyLocalMasDias } from '@/lib/fecha';

type Periodo = 'diario' | 'semanal' | 'mensual';
type Vista = 'ambos' | 'despacho' | 'materia-prima';

interface Respuesta {
  periodo: Periodo; from: string; to: string;
  totales: { viajesDespacho: number; m3Despacho: number; viajesMP: number; cantidadMP: number };
  serie: { periodo: string; viajesDespacho: number; m3Despacho: number; viajesMP: number; cantidadMP: number; materiales: { material: string; unidad: string; viajes: number; cantidad: number }[] }[];
  porChofer: { choferId: number | null; chofer: string; viajesDespacho: number; m3Despacho: number; viajesMP: number; cantidadMP: number; totalViajes: number }[];
  porMaterial: { material: string; unidad: string; viajes: number; cantidad: number }[];
  detalleDespacho: { id: number; numeroGuia: number | null; tipo: string; fecha: string; periodo: string; cantidad: number; chofer: string | null; unidad: string | null; cliente: string | null; obra: string | null; producto: string | null }[];
  detalleMP: { id: number; fecha: string; periodo: string; cantidad: number; unidad: string | null; material: string | null; chofer: string | null; unidadNumero: string | null; proveedor: string | null }[];
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const num = (v: number) => Number(v || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function etiquetaPeriodo(p: string, periodo: Periodo) {
  if (periodo === 'mensual') {
    const [y, m] = p.split('-').map(Number);
    return `${MESES[(m || 1) - 1]} ${y}`;
  }
  if (periodo === 'semanal') {
    const [y, m, d] = p.split('-').map(Number);
    const fin = new Date(y, m - 1, d + 6);
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')} – ${String(fin.getDate()).padStart(2, '0')}/${String(fin.getMonth() + 1).padStart(2, '0')}`;
  }
  return formatearFechaCorta(p);
}

function rangoPorDefecto(periodo: Periodo): [string, string] {
  if (periodo === 'diario') return [hoyLocalMasDias(-29), hoyLocal()];
  if (periodo === 'semanal') return [hoyLocalMasDias(-7 * 12 + 1), hoyLocal()];
  const [y, m] = hoyLocal().split('-').map(Number);
  const ini = new Date(y, m - 12, 1);
  return [`${ini.getFullYear()}-${String(ini.getMonth() + 1).padStart(2, '0')}-01`, hoyLocal()];
}

export default function HistoricoViajesContent() {
  const { socket } = useSocket();
  const [periodo, setPeriodo] = useState<Periodo>('diario');
  const [vista, setVista] = useState<Vista>('ambos');
  const [[from, to], setRango] = useState<[string, string]>(rangoPorDefecto('diario'));
  const [choferId, setChoferId] = useState('');
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [periodoAbierto, setPeriodoAbierto] = useState<string | null>(null);
  const [choferes, setChoferes] = useState<{ id: number; nombre: string }[]>([]);

  useEffect(() => {
    fetch('/api/choferes').then((r) => r.json()).then((d) => setChoferes(d.choferes || [])).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    const params = new URLSearchParams({ periodo });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (choferId) params.set('choferId', choferId);
    fetch(`/api/historico-viajes?${params}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Error al cargar');
        if (!cancelado) { setDatos(d); setError(''); }
      })
      .catch((e) => !cancelado && setError(e.message))
      .finally(() => !cancelado && setLoading(false));
    return () => { cancelado = true; };
  }, [periodo, from, to, choferId, refresh]);

  useEffect(() => {
    if (!socket) return;
    const act = () => setRefresh((k) => k + 1);
    const ev = ['guia-despacho:created', 'materia-prima:created', 'materia-prima:updated', 'materia-prima:deleted', 'viajes-mp:changed'];
    ev.forEach((e) => socket.on(e, act));
    return () => { ev.forEach((e) => socket.off(e, act)); };
  }, [socket]);

  const cambiarPeriodo = (p: Periodo) => { setPeriodo(p); setRango(rangoPorDefecto(p)); setPeriodoAbierto(null); };

  const verD = vista !== 'materia-prima';
  const verM = vista !== 'despacho';

  const chartData = useMemo(() => (datos?.serie || []).map((s) => ({
    nombre: etiquetaPeriodo(s.periodo, periodo),
    'Viajes despacho': s.viajesDespacho,
    'Viajes materia prima': s.viajesMP,
  })), [datos, periodo]);

  const serieDesc = useMemo(() => [...(datos?.serie || [])].reverse(), [datos]);
  const nombrePeriodo = periodo === 'diario' ? 'Día' : periodo === 'semanal' ? 'Semana' : 'Mes';

  const exportData = {
    title: `Historico de Viajes ${periodo}`,
    columns: [nombrePeriodo, ...(verD ? ['Viajes despacho', 'M³ despachados'] : []), ...(verM ? ['Viajes materia prima', 'Cantidad MP', 'Detalle materiales'] : [])],
    data: serieDesc.map((s) => [
      etiquetaPeriodo(s.periodo, periodo),
      ...(verD ? [s.viajesDespacho, num(s.m3Despacho)] : []),
      ...(verM ? [s.viajesMP, num(s.cantidadMP), s.materiales.map((m) => `${m.material}: ${m.viajes} viajes / ${num(m.cantidad)} ${m.unidad}`).join(' | ')] : []),
    ]),
    footer: datos ? `Total: ${verD ? `${datos.totales.viajesDespacho} viajes de despacho (${num(datos.totales.m3Despacho)} M³)` : ''}${verD && verM ? ' · ' : ''}${verM ? `${datos.totales.viajesMP} viajes de materia prima` : ''}` : undefined,
  };

  const tabCls = (activo: boolean, color = 'bg-indigo-600') => `px-3 py-1.5 rounded-md text-sm font-medium transition ${activo ? `${color} text-white` : 'text-slate-600 hover:bg-slate-100'}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl"><History className="w-5 h-5 text-indigo-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Histórico de Viajes</h1>
            <p className="text-sm text-slate-500">Viajes de despacho y de materia prima por día, semana o mes.</p>
          </div>
        </div>
        <ExportButtons excelData={exportData} />
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center gap-3 flex-wrap">
        <div className="flex bg-white border border-slate-200 rounded-lg p-1">
          {(['diario', 'semanal', 'mensual'] as Periodo[]).map((p) => (
            <button key={p} onClick={() => cambiarPeriodo(p)} className={tabCls(periodo === p)}>{p === 'diario' ? 'Diario' : p === 'semanal' ? 'Semanal' : 'Mensual'}</button>
          ))}
        </div>
        <div className="flex bg-white border border-slate-200 rounded-lg p-1">
          {([['ambos', 'Ambos'], ['despacho', 'Despacho'], ['materia-prima', 'Materia prima']] as [Vista, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setVista(k)} className={tabCls(vista === k, 'bg-slate-800')}>{l}</button>
          ))}
        </div>
        <DateRangePicker from={from} to={to} onChange={(f, t) => setRango(f || t ? [f, t] : rangoPorDefecto(periodo))} />
        <select value={choferId} onChange={(e) => setChoferId(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700">
          <option value="">Todos los choferes</option>
          {choferes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

      {loading && !datos ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400" /></div>
      ) : datos && (
        <>
          <SummaryCards cards={[
            ...(verD ? [
              { label: 'Viajes despacho', value: datos.totales.viajesDespacho, icon: <Truck size={18} className="text-blue-600" />, color: 'bg-blue-50' },
              { label: 'M³ despachados', value: num(datos.totales.m3Despacho), icon: <Package size={18} className="text-blue-600" />, color: 'bg-blue-50' },
            ] : []),
            ...(verM ? [
              { label: 'Viajes materia prima', value: datos.totales.viajesMP, icon: <Route size={18} className="text-orange-600" />, color: 'bg-orange-50' },
              { label: 'Cantidad MP recibida', value: num(datos.totales.cantidadMP), icon: <Package size={18} className="text-orange-600" />, color: 'bg-orange-50' },
            ] : []),
          ]} />

          {chartData.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Viajes por {nombrePeriodo.toLowerCase()}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  {verD && <Bar dataKey="Viajes despacho" fill="#2563eb" radius={[4, 4, 0, 0]} />}
                  {verM && <Bar dataKey="Viajes materia prima" fill="#ea580c" radius={[4, 4, 0, 0]} />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabla por período */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Histórico {periodo}</h3>
              <p className="text-xs text-slate-500">Hacé clic en una fila para ver los viajes de ese {nombrePeriodo.toLowerCase()}.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">{nombrePeriodo}</th>
                    {verD && <th className="px-4 py-3 text-right">Viajes despacho</th>}
                    {verD && <th className="px-4 py-3 text-right">M³ despachados</th>}
                    {verM && <th className="px-4 py-3 text-right">Viajes MP</th>}
                    {verM && <th className="px-4 py-3 text-left">Materiales</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {serieDesc.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-slate-400">Sin viajes en el rango.</td></tr>}
                  {serieDesc.map((s) => {
                    const abierto = periodoAbierto === s.periodo;
                    const dDesp = abierto ? datos.detalleDespacho.filter((x) => x.periodo === s.periodo) : [];
                    const dMp = abierto ? datos.detalleMP.filter((x) => x.periodo === s.periodo) : [];
                    return (
                      <Fragment key={s.periodo}>
                        <tr onClick={() => setPeriodoAbierto(abierto ? null : s.periodo)} className={`cursor-pointer hover:bg-indigo-50/40 ${abierto ? 'bg-indigo-50/60' : ''}`}>
                          <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{etiquetaPeriodo(s.periodo, periodo)}</td>
                          {verD && <td className="px-4 py-3 text-right text-blue-700 font-semibold">{s.viajesDespacho}</td>}
                          {verD && <td className="px-4 py-3 text-right text-slate-700">{num(s.m3Despacho)}</td>}
                          {verM && <td className="px-4 py-3 text-right text-orange-700 font-semibold">{s.viajesMP}</td>}
                          {verM && (
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {s.materiales.length === 0 && <span className="text-slate-400">—</span>}
                                {s.materiales.map((m) => (
                                  <span key={`${m.material}-${m.unidad}`} className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 text-xs">
                                    {m.material}: {m.viajes} · {num(m.cantidad)} {m.unidad}
                                  </span>
                                ))}
                              </div>
                            </td>
                          )}
                        </tr>
                        {abierto && (
                          <tr key={`${s.periodo}-det`} className="bg-slate-50/60">
                            <td colSpan={5} className="px-4 py-4">
                              <div className={`grid gap-4 ${verD && verM ? 'lg:grid-cols-2' : ''}`}>
                                {verD && (
                                  <div>
                                    <p className="text-xs font-bold text-blue-700 uppercase mb-2">Despachos ({dDesp.length})</p>
                                    <div className="space-y-1 max-h-72 overflow-y-auto">
                                      {dDesp.length === 0 && <p className="text-xs text-slate-400">Sin despachos.</p>}
                                      {dDesp.map((g) => (
                                        <div key={g.id} className="flex justify-between gap-2 text-xs bg-white border border-slate-100 rounded-md px-3 py-2">
                                          <span className="text-slate-700">
                                            <b>Guía {g.numeroGuia ?? `#${g.id}`}</b> · {formatearFechaCorta(g.fecha)} · {g.chofer || 'Sin chofer'}{g.unidad ? ` (U-${g.unidad})` : ''} → {g.cliente || '—'}{g.obra ? ` / ${g.obra}` : ''}
                                          </span>
                                          <span className="font-semibold whitespace-nowrap">{num(g.cantidad)} M³</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {verM && (
                                  <div>
                                    <p className="text-xs font-bold text-orange-700 uppercase mb-2">Materia prima ({dMp.length})</p>
                                    <div className="space-y-1 max-h-72 overflow-y-auto">
                                      {dMp.length === 0 && <p className="text-xs text-slate-400">Sin viajes de materia prima.</p>}
                                      {dMp.map((m) => (
                                        <div key={m.id} className="flex justify-between gap-2 text-xs bg-white border border-slate-100 rounded-md px-3 py-2">
                                          <span className="text-slate-700">
                                            <b>{m.material || '—'}</b> · {formatearFechaCorta(m.fecha)} · {m.chofer || 'Sin chofer'}{m.unidadNumero ? ` (U-${m.unidadNumero})` : ''}{m.proveedor ? ` ← ${m.proveedor}` : ''}
                                          </span>
                                          <span className="font-semibold whitespace-nowrap">{num(m.cantidad)} {m.unidad}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Por chofer */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Users size={16} className="text-slate-500" /><h3 className="font-bold text-slate-900">Viajes por chofer</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Chofer</th>
                      {verD && <th className="px-4 py-3 text-right">Despacho</th>}
                      {verD && <th className="px-4 py-3 text-right">M³</th>}
                      {verM && <th className="px-4 py-3 text-right">Materia prima</th>}
                      {verD && verM && <th className="px-4 py-3 text-right">Total</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {datos.porChofer.filter((c) => (verD && c.viajesDespacho) || (verM && c.viajesMP)).map((c) => (
                      <tr key={`${c.choferId}-${c.chofer}`}>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{c.chofer}</td>
                        {verD && <td className="px-4 py-2.5 text-right text-blue-700">{c.viajesDespacho}</td>}
                        {verD && <td className="px-4 py-2.5 text-right text-slate-600">{num(c.m3Despacho)}</td>}
                        {verM && <td className="px-4 py-2.5 text-right text-orange-700">{c.viajesMP}</td>}
                        {verD && verM && <td className="px-4 py-2.5 text-right font-bold">{c.totalViajes}</td>}
                      </tr>
                    ))}
                    {datos.porChofer.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-400">Sin datos.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Por material */}
            {verM && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                  <Package size={16} className="text-orange-500" /><h3 className="font-bold text-slate-900">Materia prima por material</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {datos.porMaterial.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Sin viajes de materia prima.</p>}
                  {datos.porMaterial.map((m) => (
                    <div key={`${m.material}-${m.unidad}`} className="px-5 py-3 flex justify-between text-sm">
                      <div>
                        <p className="font-medium text-slate-800">{m.material}</p>
                        <p className="text-xs text-slate-500">{m.viajes} viajes</p>
                      </div>
                      <span className="font-semibold text-slate-800">{num(m.cantidad)} {m.unidad}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
