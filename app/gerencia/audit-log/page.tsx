"use client";

import { useState, useEffect } from "react";
import {
  Shield, Loader2,   AlertCircle, X, Eye,
  PlusCircle, Pencil, Trash2, Clock, User, FileText, Filter
} from "lucide-react";
import { useSocket } from '@/contexts/SocketContext';
import { aFechaLocal, formatearFechaHora } from '@/lib/fecha';
interface AuditLog {
  id: number;
  usuarioId: number | null;
  usuarioNombre: string | null;
  usuarioEmail: string | null;
  usuarioRol: string | null;
  accion: string;
  modulo: string;
  entidadId: number | null;
  descripcion: string | null;
  datosAnteriores: any;
  datosNuevos: any;
  ipAddress: string | null;
  createdAt: string;
}

const MODULOS = [
  "Todos", "Usuarios", "Clientes", "Proveedores", "Vendedores", "Bancos",
  "Choferes", "Unidades", "Productos", "Agregados", "Materia Prima",
  "Ingresos", "Egresos", "Facturas", "Retenciones", "Pedidos",
  "Guías de Despacho", "Órdenes de Compra"
];

const ACCIONES = [
  { value: "todos", label: "Todas" },
  { value: "crear", label: "Creación", icon: PlusCircle, color: "text-emerald-600" },
  { value: "editar", label: "Edición", icon: Pencil, color: "text-blue-600" },
  { value: "eliminar", label: "Eliminación", icon: Trash2, color: "text-red-600" },
];

export default function GerenciaAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroModulo, setFiltroModulo] = useState("Todos");
  const [filtroAccion, setFiltroAccion] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { socket } = useSocket();

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchLogs();
    socket.on('audit-log:created', handleUpdate);
    return () => { socket.off('audit-log:created', handleUpdate); };
  }, [socket]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gerencia/audit-log");
      const data = await res.json();
      if (data.success) setLogs(data.logs);
    } catch {
      setError("Error al cargar los logs de auditoría");
    } finally {
      setLoading(false);
    }
  };

  const logsFiltrados = logs.filter(log => {
    if (filtroModulo !== "Todos" && log.modulo !== filtroModulo) return false;
    if (filtroAccion !== "todos" && log.accion !== filtroAccion) return false;
    if (busqueda) {
      const b = busqueda.toLowerCase();
      const searchable = `${log.descripcion || ''} ${log.usuarioNombre || ''} ${log.usuarioEmail || ''} ${log.modulo}`.toLowerCase();
      if (!searchable.includes(b)) return false;
    }
    return true;
  });

  const formatFecha = (fecha: string) => {
    const d = aFechaLocal(fecha);
    if (!d) return '—';
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);
    if (diffMin < 1) return "Ahora mismo";
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffH < 24) return `Hace ${diffH}h`;
    if (diffD < 7) return `Hace ${diffD}d`;
    return formatearFechaHora(fecha);
  };

  const getAccionInfo = (accion: string) => {
    const found = ACCIONES.find(a => a.value === accion);
    if (!found) return { icon: FileText, color: "text-slate-600", label: accion, bg: "bg-slate-50" };
    const icon = found.icon || FileText;
    const colorMap: Record<string, string> = { crear: "text-emerald-600", editar: "text-blue-600", eliminar: "text-red-600" };
    const bgMap: Record<string, string> = { crear: "bg-emerald-50", editar: "bg-blue-50", eliminar: "bg-red-50" };
    return { icon, color: colorMap[accion] || "text-slate-600", label: found.label, bg: bgMap[accion] || "bg-slate-50" };
  };

  const stats = {
    total: logs.length,
    hoy: logs.filter(l => { const d = new Date(l.createdAt); const now = new Date(); return d.toDateString() === now.toDateString(); }).length,
    crear: logs.filter(l => l.accion === 'crear').length,
    editar: logs.filter(l => l.accion === 'editar').length,
    eliminar: logs.filter(l => l.accion === 'eliminar').length,
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Shield size={28} className="text-violet-600" />
            Auditoría del Sistema
          </h1>
          <p className="text-slate-500 mt-1">Registro de todas las acciones realizadas en el sistema.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-800 p-4 rounded-xl text-sm font-medium">
          <AlertCircle size={18} className="text-red-500 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Registros", value: stats.total, color: "text-slate-900" },
          { label: "Hoy", value: stats.hoy, color: "text-violet-600" },
          { label: "Creaciones", value: stats.crear, color: "text-emerald-600" },
          { label: "Ediciones", value: stats.editar, color: "text-blue-600" },
          { label: "Eliminaciones", value: stats.eliminar, color: "text-red-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-black ${s.color} mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Buscar</label>
          <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por descripción, usuario..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 bg-white" />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Módulo</label>
          <select value={filtroModulo} onChange={e => setFiltroModulo(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-violet-400 bg-white">
            {MODULOS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Acción</label>
          <select value={filtroAccion} onChange={e => setFiltroAccion(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-violet-400 bg-white">
            {ACCIONES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 size={24} className="animate-spin text-slate-300 mx-auto" /></div>
        ) : logsFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <Shield size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No hay registros de auditoría</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Acción</th>
                  <th className="px-6 py-4">Módulo</th>
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4">IP</th>
                  <th className="px-6 py-4 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logsFiltrados.slice(0, 200).map((log) => {
                  const accionInfo = getAccionInfo(log.accion);
                  const AccionIcon = accionInfo.icon;
                  const isExpanded = expandedId === log.id;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Clock size={12} className="text-slate-400" />
                          <span className="text-xs font-medium">{formatFecha(log.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700">
                            {log.usuarioNombre?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-xs">{log.usuarioNombre || 'Sistema'}</p>
                            <p className="text-[10px] text-slate-400">{log.usuarioRol || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${accionInfo.bg} ${accionInfo.color}`}>
                          <AccionIcon size={11} /> {accionInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs font-medium text-slate-700">{log.modulo}</td>
                      <td className="px-6 py-3 text-xs text-slate-600 max-w-xs truncate">{log.descripcion}</td>
                      <td className="px-6 py-3 text-[11px] text-slate-400 font-mono">{log.ipAddress || '-'}</td>
                      <td className="px-6 py-3 text-right">
                        {(log.datosAnteriores || log.datosNuevos) && (
                          <button onClick={() => setExpandedId(isExpanded ? null : log.id)} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                            <Eye size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EXPANDED DETAIL MODAL */}
      {expandedId && (() => {
        const log = logs.find(l => l.id === expandedId);
        if (!log) return null;
        const ant = log.datosAnteriores;
        const nuevos = log.datosNuevos;
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setExpandedId(null)} />
            <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
              <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Detalle del Registro #{log.id}</h3>
                  <p className="text-sm text-slate-500 mt-1">{log.descripcion}</p>
                </div>
                <button onClick={() => setExpandedId(null)} className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100"><X size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-400 text-xs">Fecha:</span><p className="font-medium">{new Date(log.createdAt).toLocaleString("es-VE")}</p></div>
                  <div><span className="text-slate-400 text-xs">IP:</span><p className="font-medium font-mono">{log.ipAddress || '-'}</p></div>
                </div>
                {ant && (
                  <div>
                    <p className="text-xs font-bold text-red-500 uppercase mb-2">Valores Anteriores</p>
                    <pre className="bg-red-50 p-3 rounded-lg text-xs text-slate-700 overflow-auto">{JSON.stringify(ant, null, 2)}</pre>
                  </div>
                )}
                {nuevos && (
                  <div>
                    <p className="text-xs font-bold text-emerald-500 uppercase mb-2">Valores Nuevos</p>
                    <pre className="bg-emerald-50 p-3 rounded-lg text-xs text-slate-700 overflow-auto">{JSON.stringify(nuevos, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
