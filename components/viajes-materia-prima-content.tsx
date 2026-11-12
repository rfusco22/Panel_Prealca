'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Route, Plus, X, Loader2, CheckCircle2, XCircle, Pencil, Trash2, Truck, Clock, PackageCheck, Search,
} from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/hooks/useAuth';
import { DateRangePicker, QuickDateFilters } from '@/components/reports/DateRangePicker';
import { ExportButtons } from '@/components/reports/ExportButtons';
import { SummaryCards } from '@/components/reports/SummaryCards';
import { formatearFechaCorta, formatearFechaHora, hoyLocal, hoyLocalMasDias } from '@/lib/fecha';

interface Viaje {
  id: number;
  fecha: string;
  choferId: number | null; choferNombre: string | null; choferCedula: string | null;
  unidadId: number | null; unidadNumero: string | null; unidadPlaca: string | null;
  agregadoId: number; agregadoNombre: string | null; unidadMedida: string | null;
  proveedorId: number | null; proveedorNombre: string | null;
  plantaId: number | null; plantaNombre: string | null;
  cantidad: string | number | null; unidad: string;
  nroGuiaProveedor: string | null;
  horaSalida: string | null; horaLlegada: string | null;
  estado: 'en_ruta' | 'recibido' | 'cancelado';
  observaciones: string | null;
  usuarioNombre: string | null;
}

const ESTADOS = {
  en_ruta: { label: 'En ruta', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Truck },
  recibido: { label: 'Recibido', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', cls: 'bg-slate-100 text-slate-500 border-slate-200', icon: XCircle },
} as const;

const num = (v: unknown) => Number(v || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 'YYYY-MM-DD HH:mm:ss' -> 'YYYY-MM-DDTHH:mm' para <input type="datetime-local"> */
const aInputDT = (v: string | null) => (v ? v.replace(' ', 'T').slice(0, 16) : '');
function ahoraInputDT() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${hoyLocal()}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const formVacio = () => ({
  fecha: hoyLocal(),
  chofer_id: '', unidad_id: '', agregado_id: '', proveedor_id: '', planta_id: '',
  cantidad: '', nro_guia_proveedor: '', hora_salida: ahoraInputDT(), hora_llegada: '',
  observaciones: '', estado: 'en_ruta' as 'en_ruta' | 'recibido',
});

export default function ViajesMateriaPrimaContent() {
  const { socket } = useSocket();
  const { session } = useAuth();
  const role = session?.user.role;
  const puedeCrear = role === 'admin' || role === 'gerencia' || role === 'dosificador';
  const puedeGestionar = role === 'admin' || role === 'gerencia';

  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [from, setFrom] = useState(hoyLocalMasDias(-30));
  const [to, setTo] = useState(hoyLocal());
  const [estadoFiltro, setEstadoFiltro] = useState<'' | 'en_ruta' | 'recibido' | 'cancelado'>('');
  const [busqueda, setBusqueda] = useState('');

  const [agregados, setAgregados] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [choferes, setChoferes] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);

  const [modal, setModal] = useState<null | { modo: 'nuevo' } | { modo: 'editar'; viaje: Viaje } | { modo: 'recibir'; viaje: Viaje }>(null);
  const [form, setForm] = useState(formVacio());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  // Catálogos
  useEffect(() => {
    const leer = async (url: string, claves: string[]) => {
      try {
        const r = await fetch(url);
        if (!r.ok) return [];
        const d = await r.json();
        if (Array.isArray(d)) return d;
        for (const k of claves) if (Array.isArray(d[k])) return d[k];
        return [];
      } catch { return []; }
    };
    Promise.all([
      leer('/api/agregados', ['agregados', 'data']),
      leer('/api/proveedores', ['proveedores', 'data']),
      leer('/api/choferes', ['choferes', 'data']),
      leer('/api/unidades', ['unidades', 'data']),
    ]).then(([a, p, c, u]) => { setAgregados(a); setProveedores(p); setChoferes(c); setUnidades(u); });
  }, []);

  // Viajes
  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (estadoFiltro) params.set('estado', estadoFiltro);
    fetch(`/api/viajes-materia-prima?${params}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelado) setViajes(d.viajes || []); })
      .catch(() => { if (!cancelado) setViajes([]); })
      .finally(() => { if (!cancelado) setLoading(false); });
    return () => { cancelado = true; };
  }, [from, to, estadoFiltro, refresh]);

  useEffect(() => {
    if (!socket) return;
    const actualizar = () => setRefresh((k) => k + 1);
    socket.on('viajes-mp:changed', actualizar);
    return () => { socket.off('viajes-mp:changed', actualizar); };
  }, [socket]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return viajes;
    return viajes.filter((v) =>
      `${v.choferNombre || ''} ${v.agregadoNombre || ''} ${v.proveedorNombre || ''} ${v.plantaNombre || ''} ${v.unidadNumero || ''} ${v.unidadPlaca || ''} ${v.nroGuiaProveedor || ''}`
        .toLowerCase().includes(q));
  }, [viajes, busqueda]);

  const resumen = useMemo(() => ({
    enRuta: viajes.filter((v) => v.estado === 'en_ruta').length,
    recibidos: viajes.filter((v) => v.estado === 'recibido').length,
    cantidad: viajes.filter((v) => v.estado === 'recibido').reduce((s, v) => s + Number(v.cantidad || 0), 0),
    choferes: new Set(viajes.filter((v) => v.estado !== 'cancelado').map((v) => v.choferId)).size,
  }), [viajes]);

  const plantas: any[] = proveedores.find((p) => String(p.id) === form.proveedor_id)?.plantas || [];
  const unidadMaterial = agregados.find((a) => String(a.id) === form.agregado_id)?.unidadMedida || '';

  const abrirNuevo = () => { setForm(formVacio()); setError(''); setModal({ modo: 'nuevo' }); };
  const abrirEditar = (v: Viaje) => {
    setForm({
      fecha: String(v.fecha).slice(0, 10),
      chofer_id: v.choferId ? String(v.choferId) : '', unidad_id: v.unidadId ? String(v.unidadId) : '',
      agregado_id: String(v.agregadoId), proveedor_id: v.proveedorId ? String(v.proveedorId) : '',
      planta_id: v.plantaId ? String(v.plantaId) : '', cantidad: v.cantidad != null ? String(v.cantidad) : '',
      nro_guia_proveedor: v.nroGuiaProveedor || '', hora_salida: aInputDT(v.horaSalida), hora_llegada: aInputDT(v.horaLlegada),
      observaciones: v.observaciones || '', estado: v.estado === 'recibido' ? 'recibido' : 'en_ruta',
    });
    setError(''); setModal({ modo: 'editar', viaje: v });
  };
  const abrirRecibir = (v: Viaje) => {
    setForm({ ...formVacio(), cantidad: v.cantidad != null ? String(v.cantidad) : '', hora_llegada: ahoraInputDT(), nro_guia_proveedor: v.nroGuiaProveedor || '', fecha: hoyLocal() });
    setError(''); setModal({ modo: 'recibir', viaje: v });
  };

  const enviar = async (metodo: 'POST' | 'PUT', cuerpo: any) => {
    setGuardando(true); setError('');
    try {
      const r = await fetch('/api/viajes-materia-prima', { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'No se pudo guardar');
      setModal(null); setRefresh((k) => k + 1);
      return true;
    } catch (e: any) { setError(e.message); return false; } finally { setGuardando(false); }
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    if (modal.modo === 'nuevo') {
      if (await enviar('POST', form)) mostrarAviso(form.estado === 'recibido' ? 'Viaje registrado y materia prima ingresada al inventario.' : 'Viaje registrado en ruta.');
    } else if (modal.modo === 'editar') {
      if (await enviar('PUT', { ...form, id: modal.viaje.id, accion: 'editar' })) mostrarAviso('Viaje actualizado.');
    } else {
      if (await enviar('PUT', { id: modal.viaje.id, accion: 'recibir', cantidad: form.cantidad, hora_llegada: form.hora_llegada, fecha: form.fecha, nro_guia_proveedor: form.nro_guia_proveedor, observaciones: form.observaciones }))
        mostrarAviso('Viaje recibido: la materia prima se sumó al inventario.');
    }
  };

  const cancelarViaje = async (v: Viaje) => {
    if (!confirm(`¿Cancelar el viaje #${v.id} de ${v.choferNombre || 'chofer'}?`)) return;
    if (await enviar('PUT', { id: v.id, accion: 'cancelar' })) mostrarAviso('Viaje cancelado.');
  };

  const eliminar = async (v: Viaje) => {
    const extra = v.estado === 'recibido' ? '\n\nTambién se eliminará la entrada de materia prima del inventario.' : '';
    if (!confirm(`¿Eliminar el viaje #${v.id}?${extra}`)) return;
    const r = await fetch(`/api/viajes-materia-prima?id=${v.id}`, { method: 'DELETE' });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { alert(d.error || 'No se pudo eliminar'); return; }
    setRefresh((k) => k + 1); mostrarAviso('Viaje eliminado.');
  };

  const mostrarAviso = (t: string) => { setAviso(t); setTimeout(() => setAviso(''), 3500); };

  const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white';
  const labelCls = 'block text-xs font-semibold text-slate-600 mb-1';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-50 rounded-xl"><Route className="w-5 h-5 text-orange-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Viajes de Materia Prima</h1>
            <p className="text-sm text-slate-500">Viajes de los choferes a buscar piedra, arena, cemento y demás materiales.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <ExportButtons excelData={{
            title: 'Viajes de Materia Prima',
            columns: ['#', 'Fecha', 'Chofer', 'Unidad', 'Material', 'Proveedor / Planta', 'Cantidad', 'Guía prov.', 'Salida', 'Llegada', 'Estado'],
            data: filtrados.map((v) => [
              v.id, formatearFechaCorta(v.fecha), v.choferNombre || '', v.unidadNumero || '', v.agregadoNombre || '',
              [v.proveedorNombre, v.plantaNombre].filter(Boolean).join(' / '),
              v.cantidad != null ? `${num(v.cantidad)} ${v.unidad}` : '', v.nroGuiaProveedor || '',
              formatearFechaHora(v.horaSalida, ''), formatearFechaHora(v.horaLlegada, ''), ESTADOS[v.estado].label,
            ]),
          }} />
          {puedeCrear && (
            <button onClick={abrirNuevo} className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold shadow-sm transition">
              <Plus size={16} /> Nuevo viaje
            </button>
          )}
        </div>
      </div>

      {aviso && <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2"><CheckCircle2 size={16} />{aviso}</div>}

      <SummaryCards cards={[
        { label: 'En ruta', value: resumen.enRuta, icon: <Truck size={18} className="text-amber-600" />, color: 'bg-amber-50' },
        { label: 'Recibidos', value: resumen.recibidos, icon: <PackageCheck size={18} className="text-emerald-600" />, color: 'bg-emerald-50' },
        { label: 'Cantidad recibida', value: num(resumen.cantidad), icon: <Route size={18} className="text-orange-600" />, color: 'bg-orange-50' },
        { label: 'Choferes', value: resumen.choferes, icon: <Clock size={18} className="text-blue-600" />, color: 'bg-blue-50' },
      ]} />

      <div className="flex flex-col xl:flex-row xl:items-end gap-3">
        <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
        <QuickDateFilters onChange={(f, t) => { setFrom(f); setTo(t); }} />
        <div className="flex bg-white border border-slate-200 rounded-lg p-1 text-sm">
          {([['', 'Todos'], ['en_ruta', 'En ruta'], ['recibido', 'Recibidos'], ['cancelado', 'Cancelados']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setEstadoFiltro(k)} className={`px-3 py-1.5 rounded-md font-medium transition ${estadoFiltro === k ? 'bg-orange-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{l}</button>
          ))}
        </div>
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar chofer, material, proveedor, placa..." className="flex-1 text-sm outline-none bg-transparent" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Chofer / Unidad</th>
                <th className="px-4 py-3 text-left">Material</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Proveedor / Planta</th>
                <th className="px-4 py-3 text-right">Cantidad</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Salida / Llegada</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <tr><td colSpan={8} className="py-12 text-center"><Loader2 className="animate-spin inline text-slate-400" /></td></tr>}
              {!loading && filtrados.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-slate-400">No hay viajes en el período.</td></tr>}
              {!loading && filtrados.map((v) => {
                const E = ESTADOS[v.estado] || ESTADOS.en_ruta;
                return (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium text-slate-800">{formatearFechaCorta(v.fecha)}</p>
                      <p className="text-[11px] text-slate-400">#{v.id}{v.nroGuiaProveedor ? ` · Guía ${v.nroGuiaProveedor}` : ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{v.choferNombre || '—'}</p>
                      <p className="text-xs text-slate-500">{v.unidadNumero ? `Unidad ${v.unidadNumero}` : 'Sin unidad'}{v.unidadPlaca ? ` · ${v.unidadPlaca}` : ''}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{v.agregadoNombre || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{v.proveedorNombre || '—'}{v.plantaNombre ? <span className="text-xs text-slate-400"> / {v.plantaNombre}</span> : null}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-slate-800">{v.cantidad != null && v.cantidad !== '' ? `${num(v.cantidad)} ${v.unidad}` : <span className="text-slate-400 font-normal">—</span>}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell whitespace-nowrap">
                      <p>↗ {formatearFechaHora(v.horaSalida)}</p>
                      <p>↘ {formatearFechaHora(v.horaLlegada)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${E.cls}`}><E.icon size={12} />{E.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {v.estado === 'en_ruta' && puedeCrear && (
                          <>
                            <button onClick={() => abrirRecibir(v)} className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700" title="Marcar como recibido">Recibir</button>
                            <button onClick={() => cancelarViaje(v)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md" title="Cancelar viaje"><XCircle size={16} /></button>
                          </>
                        )}
                        {puedeGestionar && (
                          <>
                            <button onClick={() => abrirEditar(v)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Editar"><Pencil size={16} /></button>
                            <button onClick={() => eliminar(v)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md" title="Eliminar"><Trash2 size={16} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => !guardando && setModal(null)}>
          <form onSubmit={guardar} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-slate-900">
                {modal.modo === 'nuevo' ? 'Nuevo viaje de materia prima' : modal.modo === 'editar' ? `Editar viaje #${modal.viaje.id}` : `Recibir viaje #${modal.viaje.id}`}
              </h2>
              <button type="button" onClick={() => setModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-4">
              {modal.modo === 'recibir' ? (
                <>
                  <div className="p-3 rounded-lg bg-slate-50 text-sm text-slate-600">
                    <b>{modal.viaje.choferNombre}</b> trae <b>{modal.viaje.agregadoNombre}</b>
                    {modal.viaje.proveedorNombre ? <> de <b>{modal.viaje.proveedorNombre}</b></> : null}.
                    Al confirmar, la cantidad se suma al inventario de materia prima.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className={labelCls}>Cantidad recibida ({modal.viaje.unidad}) *</label>
                      <input type="number" step="0.01" min="0.01" required value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} className={inputCls} /></div>
                    <div><label className={labelCls}>Fecha de entrada al inventario</label>
                      <input type="date" value={form.fecha} max={hoyLocal()} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className={inputCls} /></div>
                    <div><label className={labelCls}>Hora de llegada</label>
                      <input type="datetime-local" value={form.hora_llegada} onChange={(e) => setForm({ ...form, hora_llegada: e.target.value })} className={inputCls} /></div>
                    <div><label className={labelCls}>N° guía / nota del proveedor</label>
                      <input value={form.nro_guia_proveedor} onChange={(e) => setForm({ ...form, nro_guia_proveedor: e.target.value })} className={inputCls} /></div>
                  </div>
                </>
              ) : (
                <>
                  {modal.modo === 'nuevo' && (
                    <div className="flex bg-slate-100 rounded-lg p-1 text-sm">
                      {([['en_ruta', 'Sale ahora (en ruta)'], ['recibido', 'Ya llegó (recibido)']] as const).map(([k, l]) => (
                        <button type="button" key={k} onClick={() => setForm({ ...form, estado: k, hora_llegada: k === 'recibido' ? (form.hora_llegada || ahoraInputDT()) : '' })}
                          className={`flex-1 px-3 py-2 rounded-md font-semibold transition ${form.estado === k ? 'bg-white shadow text-orange-700' : 'text-slate-500'}`}>{l}</button>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className={labelCls}>Fecha *</label>
                      <input type="date" required value={form.fecha} max={hoyLocal()} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className={inputCls} /></div>
                    <div><label className={labelCls}>Material *</label>
                      <select required value={form.agregado_id} onChange={(e) => setForm({ ...form, agregado_id: e.target.value })} className={inputCls}>
                        <option value="">Seleccionar...</option>
                        {agregados.map((a) => <option key={a.id} value={a.id}>{a.nombre} ({a.unidadMedida || a.unidad_medida})</option>)}
                      </select></div>
                    <div><label className={labelCls}>Chofer *</label>
                      <select required value={form.chofer_id} onChange={(e) => setForm({ ...form, chofer_id: e.target.value })} className={inputCls}>
                        <option value="">Seleccionar...</option>
                        {choferes.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.cedula ? ` - ${c.cedula}` : ''}</option>)}
                      </select></div>
                    <div><label className={labelCls}>Unidad</label>
                      <select value={form.unidad_id} onChange={(e) => setForm({ ...form, unidad_id: e.target.value })} className={inputCls}>
                        <option value="">Sin unidad</option>
                        {unidades.map((u) => <option key={u.id} value={u.id}>{u.numeroUnidad || u.numero_unidad}{u.placa ? ` - ${u.placa}` : ''}</option>)}
                      </select></div>
                    <div><label className={labelCls}>Proveedor</label>
                      <select value={form.proveedor_id} onChange={(e) => setForm({ ...form, proveedor_id: e.target.value, planta_id: '' })} className={inputCls}>
                        <option value="">Sin proveedor</option>
                        {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select></div>
                    <div><label className={labelCls}>Planta</label>
                      <select value={form.planta_id} disabled={plantas.length === 0} onChange={(e) => setForm({ ...form, planta_id: e.target.value })} className={`${inputCls} disabled:bg-slate-50`}>
                        <option value="">{plantas.length ? 'Seleccionar...' : 'Sin plantas'}</option>
                        {plantas.map((pl) => <option key={pl.id} value={pl.id}>{pl.nombre}</option>)}
                      </select></div>
                    <div><label className={labelCls}>Cantidad {unidadMaterial ? `(${unidadMaterial})` : ''} {form.estado === 'recibido' ? '*' : '(estimada)'}</label>
                      <input type="number" step="0.01" min="0" required={form.estado === 'recibido'} value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} className={inputCls} /></div>
                    <div><label className={labelCls}>N° guía / nota del proveedor</label>
                      <input value={form.nro_guia_proveedor} onChange={(e) => setForm({ ...form, nro_guia_proveedor: e.target.value })} className={inputCls} /></div>
                    <div><label className={labelCls}>Hora de salida</label>
                      <input type="datetime-local" value={form.hora_salida} onChange={(e) => setForm({ ...form, hora_salida: e.target.value })} className={inputCls} /></div>
                    {(form.estado === 'recibido' || modal.modo === 'editar') && (
                      <div><label className={labelCls}>Hora de llegada</label>
                        <input type="datetime-local" value={form.hora_llegada} onChange={(e) => setForm({ ...form, hora_llegada: e.target.value })} className={inputCls} /></div>
                    )}
                  </div>
                </>
              )}
              <div><label className={labelCls}>Observaciones</label>
                <textarea rows={2} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} className={inputCls} /></div>
              {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 sticky bottom-0 bg-white">
              <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button type="submit" disabled={guardando} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50">
                {guardando && <Loader2 size={16} className="animate-spin" />}
                {modal.modo === 'recibir' ? 'Confirmar recepción' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
