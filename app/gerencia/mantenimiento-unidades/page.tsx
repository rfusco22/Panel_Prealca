"use client";

import { useState, useEffect, useMemo } from "react";
import { Wrench, Truck, Gauge, DollarSign, History, TrendingUp, AlertTriangle, Clock, FileText, CheckCircle2, ClipboardList } from "lucide-react";
import { formatearFechaCorta } from '@/lib/fecha';

interface Unidad {
  id: number;
  numeroUnidad: string;
  placa: string;
  ultimoMantenimiento: string | null;
  proximoMantenimiento: string | null;
}

interface Mantenimiento {
  id: number;
  unidadId: number;
  unidadNumero: string;
  unidadPlaca: string;
  fecha: string;
  tipoMantenimiento: string;
  descripcion: string;
  km: number | null;
  costo: number | null;
  costoUsd: number | null;
  realizadoPor: string | null;
}

const TIPO_MANTENIMIENTO: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  preventivo: { label: "Preventivo", bg: "bg-blue-50", text: "text-blue-700", icon: CheckCircle2 },
  correctivo: { label: "Correctivo", bg: "bg-red-50", text: "text-red-700", icon: Wrench },
  revision: { label: "Revisión", bg: "bg-emerald-50", text: "text-emerald-700", icon: ClipboardList },
  reparacion: { label: "Reparación", bg: "bg-amber-50", text: "text-amber-700", icon: Wrench },
  otro: { label: "Otro", bg: "bg-slate-50", text: "text-slate-700", icon: FileText },
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return formatearFechaCorta(d);
}

export default function GerenciaMantenimientoUnidadesPage() {
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/unidades-mantenimiento").then((r) => r.json()),
      fetch("/api/unidades").then((r) => r.json()),
    ])
      .then(([mData, uData]) => {
        setMantenimientos(mData.success ? mData.mantenimientos : []);
        setUnidades(Array.isArray(uData) ? uData : []);
      })
      .catch(() => {
        setMantenimientos([]);
        setUnidades([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = mantenimientos.length;
    const totalBs = mantenimientos.reduce((acc, m) => acc + (Number(m.costo) || 0), 0);
    const now = new Date();
    const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const costoMesBs = mantenimientos
      .filter((m) => {
        const d = new Date(m.fecha);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === mesActual;
      })
      .reduce((acc, m) => acc + (Number(m.costo) || 0), 0);
    const ultimos30 = mantenimientos.filter((m) => {
      const diff = (Date.now() - new Date(m.fecha).getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    }).length;
    return { total, totalBs, costoMesBs, ultimos30 };
  }, [mantenimientos]);

  const alertas = useMemo(() => {
    const hoy = new Date();
    const vencidos: Unidad[] = [];
    const porVencer: Unidad[] = [];
    const sinRegistro: Unidad[] = [];

    unidades.forEach((u) => {
      if (!u.ultimoMantenimiento) {
        sinRegistro.push(u);
        return;
      }
      if (u.proximoMantenimiento) {
        const prox = new Date(u.proximoMantenimiento);
        const diffDays = Math.floor((prox.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) vencidos.push(u);
        else if (diffDays <= 30) porVencer.push(u);
      }
    });

    return { vencidos, porVencer, sinRegistro };
  }, [unidades]);

  const formatBs = (v: number) => 'Bs. ' + v.toLocaleString('es-VE', { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-slate-900 rounded-xl"><Wrench className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mantenimiento de Unidades</h1>
          <p className="text-slate-500 mt-1">Historial y costos de mantenimiento de la flota.</p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Registros</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center"><History size={20} className="text-slate-700" /></div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Últimos 30 días</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.ultimos30}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center"><TrendingUp size={20} className="text-emerald-600" /></div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Costo del Mes</p>
              <p className="text-xl font-extrabold text-blue-600 mt-1">{formatBs(stats.costoMesBs)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Histórico: {formatBs(stats.totalBs)}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0"><DollarSign size={20} className="text-blue-600" /></div>
          </div>
        </div>
      </div>

      {/* ALERTAS */}
      {(alertas.vencidos.length > 0 || alertas.porVencer.length > 0 || alertas.sinRegistro.length > 0) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-amber-600" size={20} />
            <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide">Alertas de Mantenimiento</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {alertas.vencidos.length > 0 && (
              <div className="bg-white border-l-4 border-red-500 rounded-xl p-3 shadow-sm">
                <p className="text-xs font-bold text-red-700 uppercase mb-1.5 flex items-center gap-1"><Clock size={12} /> Vencido</p>
                {alertas.vencidos.slice(0, 5).map((u) => (
                  <div key={u.id} className="text-xs text-slate-700 py-1"><strong>{u.numeroUnidad}</strong> · {u.placa}</div>
                ))}
                {alertas.vencidos.length > 5 && <p className="text-[10px] text-slate-500 mt-1">+{alertas.vencidos.length - 5} más</p>}
              </div>
            )}
            {alertas.porVencer.length > 0 && (
              <div className="bg-white border-l-4 border-amber-500 rounded-xl p-3 shadow-sm">
                <p className="text-xs font-bold text-amber-700 uppercase mb-1.5 flex items-center gap-1"><AlertTriangle size={12} /> Por Vencer (≤30d)</p>
                {alertas.porVencer.slice(0, 5).map((u) => (
                  <div key={u.id} className="text-xs text-slate-700 py-1"><strong>{u.numeroUnidad}</strong> · {u.placa}</div>
                ))}
              </div>
            )}
            {alertas.sinRegistro.length > 0 && (
              <div className="bg-white border-l-4 border-slate-400 rounded-xl p-3 shadow-sm">
                <p className="text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1"><FileText size={12} /> Sin Registro</p>
                {alertas.sinRegistro.slice(0, 5).map((u) => (
                  <div key={u.id} className="text-xs text-slate-700 py-1"><strong>{u.numeroUnidad}</strong> · {u.placa}</div>
                ))}
                {alertas.sinRegistro.length > 5 && <p className="text-[10px] text-slate-500 mt-1">+{alertas.sinRegistro.length - 5} más</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LISTADO */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : mantenimientos.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No hay mantenimientos registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Unidad</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4">Km</th>
                  <th className="px-6 py-4">Costo</th>
                  <th className="px-6 py-4">Realizado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mantenimientos.map((m) => {
                  const tipo = TIPO_MANTENIMIENTO[m.tipoMantenimiento] || TIPO_MANTENIMIENTO.otro;
                  const Icon = tipo.icon;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(m.fecha)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Truck size={14} className="text-slate-400" />
                          <div>
                            <div className="font-semibold text-slate-900">#{m.unidadNumero}</div>
                            <div className="text-[10px] font-mono text-blue-600">{m.unidadPlaca}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${tipo.bg} ${tipo.text}`}>
                          <Icon size={10} /> {tipo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate">{m.descripcion}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {m.km != null ? <span className="flex items-center gap-1"><Gauge size={12} />{Number(m.km).toLocaleString("es-VE")}</span> : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                        {m.costo != null ? formatBs(Number(m.costo)) : m.costoUsd != null ? `$${Number(m.costoUsd).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="px-6 py-4">{m.realizadoPor || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
