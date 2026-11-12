'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen, Search, ArrowLeft, Loader2, Wallet, FileText, TrendingDown, Truck, AlertCircle, Scale,
} from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { DateRangePicker, QuickDateFilters } from '@/components/reports/DateRangePicker';
import { ExportButtons } from '@/components/reports/ExportButtons';
import { SummaryCards } from '@/components/reports/SummaryCards';
import { formatearFecha, formatearFechaCorta, diasHasta } from '@/lib/fecha';

interface ClienteResumen {
  id: number;
  nombre: string;
  rif: string | null;
  telefono: string | null;
  vendedor: string | null;
  totalFacturado: number;
  totalPagado: number;
  totalPagadoUsd: number;
  saldo: number;
  totalM3: number;
  cantidadFacturas: number;
  cantidadPagos: number;
  ultimaFactura: string | null;
  ultimoPago: string | null;
}

interface Movimiento {
  tipo: 'factura' | 'pago';
  id: number;
  fecha: string;
  documento: string;
  descripcion: string;
  debe: number;
  haber: number;
  estado?: string | null;
  saldo: number;
}

interface Detalle {
  cliente: { id: number; nombre: string; rif: string | null; telefono: string | null; direccion: string | null; vendedor: string | null };
  resumen: {
    totalFacturado: number; totalPagado: number; totalPagadoUsd: number; saldo: number;
    saldoAnterior: number; debePeriodo: number; haberPeriodo: number; saldoFinal: number;
    totalM3: number; cantidadGuias: number;
  };
  movimientos: Movimiento[];
  guias: { id: number; numeroGuia: number | null; tipo: string; fecha: string; cantidadM3: number; obra: string | null; producto: string | null; chofer: string | null }[];
  pendientes: { id: number; fecha: string; fechaVencimiento: string | null; total: number; estado: string }[];
}

const bs = (v: number) => `Bs. ${Number(v || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const usd = (v: number) => `$ ${Number(v || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (v: number) => Number(v || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function SaldoBadge({ saldo }: { saldo: number }) {
  if (Math.abs(saldo) < 0.01) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">Al día</span>;
  }
  if (saldo > 0) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700">Debe {bs(saldo)}</span>;
  }
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">A favor {bs(-saldo)}</span>;
}

export default function EstadoCuentaContent() {
  const { socket } = useSocket();
  const [clientes, setClientes] = useState<ClienteResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'deudores' | 'favor'>('todos');
  const [refresh, setRefresh] = useState(0);

  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Lista de clientes con saldo
  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    fetch('/api/estado-cuenta')
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Error al cargar');
        if (!cancelado) { setClientes(data.clientes || []); setError(null); }
      })
      .catch((e) => !cancelado && setError(e.message))
      .finally(() => !cancelado && setLoading(false));
    return () => { cancelado = true; };
  }, [refresh]);

  // Detalle del cliente seleccionado
  useEffect(() => {
    if (!seleccionado) { setDetalle(null); return; }
    let cancelado = false;
    setLoadingDetalle(true);
    const params = new URLSearchParams({ clienteId: String(seleccionado) });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    fetch(`/api/estado-cuenta?${params}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Error al cargar');
        if (!cancelado) setDetalle(data);
      })
      .catch((e) => !cancelado && setError(e.message))
      .finally(() => !cancelado && setLoadingDetalle(false));
    return () => { cancelado = true; };
  }, [seleccionado, from, to, refresh]);

  // Se refresca solo cuando entra una factura, un pago o una guía
  useEffect(() => {
    if (!socket) return;
    const actualizar = () => setRefresh((k) => k + 1);
    const eventos = ['facturas:created', 'facturas:updated', 'facturas:deleted', 'ingresos:created', 'ingresos:updated', 'ingresos:deleted', 'guia-despacho:created'];
    eventos.forEach((e) => socket.on(e, actualizar));
    return () => { eventos.forEach((e) => socket.off(e, actualizar)); };
  }, [socket]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return clientes.filter((c) => {
      if (q && !(`${c.nombre} ${c.rif || ''} ${c.vendedor || ''}`.toLowerCase().includes(q))) return false;
      if (filtro === 'deudores' && c.saldo <= 0.01) return false;
      if (filtro === 'favor' && c.saldo >= -0.01) return false;
      return true;
    });
  }, [clientes, busqueda, filtro]);

  const totales = useMemo(() => ({
    facturado: clientes.reduce((s, c) => s + c.totalFacturado, 0),
    pagado: clientes.reduce((s, c) => s + c.totalPagado, 0),
    porCobrar: clientes.reduce((s, c) => s + Math.max(c.saldo, 0), 0),
    deudores: clientes.filter((c) => c.saldo > 0.01).length,
  }), [clientes]);

  // ───────── Vista de detalle ─────────
  if (seleccionado) {
    const d = detalle;
    const nombre = d?.cliente.nombre || clientes.find((c) => c.id === seleccionado)?.nombre || '';
    const exportMov = {
      title: `Estado de Cuenta - ${nombre}`,
      columns: ['Fecha', 'Documento', 'Descripción', 'Debe (Bs)', 'Haber (Bs)', 'Saldo (Bs)'],
      data: [
        ...(from ? [[formatearFecha(from), 'Saldo anterior', '', '', '', num(d?.resumen.saldoAnterior || 0)]] : []),
        ...(d?.movimientos || []).map((m) => [
          formatearFecha(m.fecha), m.documento, m.descripcion,
          m.debe ? num(m.debe) : '', m.haber ? num(m.haber) : '', num(m.saldo),
        ]),
      ],
      footer: d ? `Total facturado: ${bs(d.resumen.debePeriodo)} | Total pagado: ${bs(d.resumen.haberPeriodo)} | Saldo: ${bs(d.resumen.saldoFinal)}` : undefined,
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => { setSeleccionado(null); setFrom(''); setTo(''); }} className="p-2 hover:bg-slate-100 rounded-lg transition" title="Volver">
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <div className="p-2.5 bg-indigo-50 rounded-xl"><BookOpen className="w-5 h-5 text-indigo-600" /></div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{nombre}</h1>
              <p className="text-xs text-slate-500">
                {d?.cliente.rif || 'Sin RIF'}{d?.cliente.telefono ? ` · ${d.cliente.telefono}` : ''}{d?.cliente.vendedor ? ` · Vendedor: ${d.cliente.vendedor}` : ''}
              </p>
            </div>
          </div>
          <ExportButtons excelData={exportMov} />
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
          <QuickDateFilters onChange={(f, t) => { setFrom(f); setTo(t); }} />
        </div>

        {loadingDetalle && !d ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : d && (
          <>
            <SummaryCards cards={[
              { label: from ? 'Saldo anterior' : 'Total facturado', value: from ? bs(d.resumen.saldoAnterior) : bs(d.resumen.totalFacturado), icon: <FileText size={18} className="text-blue-600" />, color: 'bg-blue-50' },
              { label: 'Facturado (período)', value: bs(d.resumen.debePeriodo), icon: <TrendingDown size={18} className="text-amber-600" />, color: 'bg-amber-50' },
              { label: 'Pagado (período)', value: bs(d.resumen.haberPeriodo), icon: <Wallet size={18} className="text-emerald-600" />, color: 'bg-emerald-50' },
              { label: 'Saldo', value: bs(d.resumen.saldoFinal), icon: <Scale size={18} className={d.resumen.saldoFinal > 0 ? 'text-red-600' : 'text-emerald-600'} />, color: d.resumen.saldoFinal > 0 ? 'bg-red-50' : 'bg-emerald-50' },
            ]} />

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Movimientos</h3>
                <span className="text-xs text-slate-500">Pagado en divisas (histórico): {usd(d.resumen.totalPagadoUsd)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Fecha</th>
                      <th className="px-4 py-3 text-left">Documento</th>
                      <th className="px-4 py-3 text-left">Descripción</th>
                      <th className="px-4 py-3 text-right">Debe</th>
                      <th className="px-4 py-3 text-right">Haber</th>
                      <th className="px-4 py-3 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {from && (
                      <tr className="bg-slate-50/50">
                        <td className="px-4 py-2.5 text-slate-500">{formatearFechaCorta(from)}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-700" colSpan={4}>Saldo anterior</td>
                        <td className="px-4 py-2.5 text-right font-semibold">{num(d.resumen.saldoAnterior)}</td>
                      </tr>
                    )}
                    {d.movimientos.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Sin movimientos en el período.</td></tr>
                    )}
                    {d.movimientos.map((m) => (
                      <tr key={`${m.tipo}-${m.id}`} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{formatearFechaCorta(m.fecha)}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 font-medium ${m.tipo === 'factura' ? 'text-blue-700' : 'text-emerald-700'}`}>
                            {m.tipo === 'factura' ? <FileText size={14} /> : <Wallet size={14} />}
                            {m.documento}
                          </span>
                          {m.estado && m.tipo === 'factura' && <span className="ml-2 text-[10px] uppercase font-bold text-slate-400">{m.estado}</span>}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 max-w-xs truncate" title={m.descripcion}>{m.descripcion || '—'}</td>
                        <td className="px-4 py-2.5 text-right text-slate-800">{m.debe ? num(m.debe) : ''}</td>
                        <td className="px-4 py-2.5 text-right text-emerald-700">{m.haber ? num(m.haber) : ''}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold ${m.saldo > 0.01 ? 'text-red-600' : 'text-slate-800'}`}>{num(m.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold text-slate-800">
                    <tr>
                      <td className="px-4 py-3" colSpan={3}>Totales del período</td>
                      <td className="px-4 py-3 text-right">{num(d.resumen.debePeriodo)}</td>
                      <td className="px-4 py-3 text-right text-emerald-700">{num(d.resumen.haberPeriodo)}</td>
                      <td className={`px-4 py-3 text-right ${d.resumen.saldoFinal > 0.01 ? 'text-red-600' : ''}`}>{num(d.resumen.saldoFinal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-500" />
                  <h3 className="font-bold text-slate-900">Facturas no marcadas como pagadas</h3>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {d.pendientes.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-400">No hay facturas pendientes.</p>}
                  {d.pendientes.map((p) => {
                    const dias = diasHasta(p.fechaVencimiento);
                    return (
                      <div key={p.id} className="px-5 py-3 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-slate-800">Factura #{p.id}</p>
                          <p className="text-xs text-slate-500">
                            Emitida {formatearFechaCorta(p.fecha)}
                            {p.fechaVencimiento && <> · Vence {formatearFechaCorta(p.fechaVencimiento)}</>}
                            {dias !== null && dias < 0 && <span className="ml-1 text-red-600 font-semibold">(vencida hace {-dias} días)</span>}
                          </p>
                        </div>
                        <span className="font-semibold text-slate-800">{bs(p.total)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-cyan-600" />
                    <h3 className="font-bold text-slate-900">Despachos</h3>
                  </div>
                  <span className="text-xs text-slate-500">{d.resumen.cantidadGuias} guías · {num(d.resumen.totalM3)} M³</span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {d.guias.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-400">Sin despachos en el período.</p>}
                  {d.guias.map((g) => (
                    <div key={g.id} className="px-5 py-3 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-slate-800">Guía {g.numeroGuia ?? `#${g.id}`} <span className="text-xs text-slate-400">({g.tipo})</span></p>
                        <p className="text-xs text-slate-500">{formatearFechaCorta(g.fecha)} · {g.producto || '—'}{g.obra ? ` · ${g.obra}` : ''}{g.chofer ? ` · ${g.chofer}` : ''}</p>
                      </div>
                      <span className="font-semibold text-slate-800">{num(g.cantidadM3)} M³</span>
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

  // ───────── Vista de lista ─────────
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl"><BookOpen className="w-5 h-5 text-indigo-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Estado de Cuenta de Clientes</h1>
            <p className="text-sm text-slate-500">Facturado vs. pagado por cliente. Hacé clic en un cliente para ver sus movimientos.</p>
          </div>
        </div>
        <ExportButtons excelData={{
          title: 'Estado de Cuenta Clientes',
          columns: ['Cliente', 'RIF', 'Facturas', 'Facturado (Bs)', 'Pagos', 'Pagado (Bs)', 'Saldo (Bs)', 'M³ despachados'],
          data: filtrados.map((c) => [c.nombre, c.rif || '', c.cantidadFacturas, num(c.totalFacturado), c.cantidadPagos, num(c.totalPagado), num(c.saldo), num(c.totalM3)]),
          footer: `Por cobrar: ${bs(totales.porCobrar)}`,
        }} />
      </div>

      <SummaryCards cards={[
        { label: 'Total facturado', value: bs(totales.facturado), icon: <FileText size={18} className="text-blue-600" />, color: 'bg-blue-50' },
        { label: 'Total cobrado', value: bs(totales.pagado), icon: <Wallet size={18} className="text-emerald-600" />, color: 'bg-emerald-50' },
        { label: 'Por cobrar', value: bs(totales.porCobrar), icon: <Scale size={18} className="text-red-600" />, color: 'bg-red-50' },
        { label: 'Clientes con deuda', value: totales.deudores, icon: <AlertCircle size={18} className="text-amber-600" />, color: 'bg-amber-50' },
      ]} />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, RIF o vendedor..." className="flex-1 text-sm outline-none bg-transparent" />
        </div>
        <div className="flex bg-white border border-slate-200 rounded-lg p-1 text-sm">
          {([['todos', 'Todos'], ['deudores', 'Con deuda'], ['favor', 'Saldo a favor']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFiltro(k)} className={`px-3 py-1.5 rounded-md font-medium transition ${filtro === k ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{l}</button>
          ))}
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-right">Facturado</th>
                <th className="px-4 py-3 text-right">Pagado</th>
                <th className="px-4 py-3 text-right">Saldo</th>
                <th className="px-4 py-3 text-right hidden md:table-cell">M³</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Último pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={6} className="px-4 py-12 text-center"><Loader2 className="animate-spin inline text-slate-400" /></td></tr>
              )}
              {!loading && filtrados.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No hay clientes que coincidan.</td></tr>
              )}
              {!loading && filtrados.map((c) => (
                <tr key={c.id} onClick={() => setSeleccionado(c.id)} className="hover:bg-indigo-50/40 cursor-pointer">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{c.nombre}</p>
                    <p className="text-xs text-slate-500">{c.rif || 'Sin RIF'}{c.vendedor ? ` · ${c.vendedor}` : ''}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{num(c.totalFacturado)}<p className="text-[10px] text-slate-400">{c.cantidadFacturas} fact.</p></td>
                  <td className="px-4 py-3 text-right text-emerald-700">{num(c.totalPagado)}<p className="text-[10px] text-slate-400">{c.cantidadPagos} pagos</p></td>
                  <td className="px-4 py-3 text-right"><SaldoBadge saldo={c.saldo} /></td>
                  <td className="px-4 py-3 text-right text-slate-600 hidden md:table-cell">{num(c.totalM3)}</td>
                  <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{formatearFechaCorta(c.ultimoPago)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
