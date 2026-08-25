"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus, X, Trash2, Edit2, AlertCircle, Wrench, Calendar, Gauge,
  Truck, DollarSign, User, FileText, Clock, CheckCircle2, AlertTriangle,
  TrendingUp, Activity, ChevronRight, History, Loader2, ClipboardList
} from "lucide-react";

interface Unidad {
  id: number;
  numeroUnidad: string;
  placa: string;
  marca: string;
  modelo: string;
  kmActual: number | null;
  ultimoMantenimiento: string | null;
  proximoMantenimiento: string | null;
  proximoMantenimientoKm: number | null;
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
  proximoServicioKm: number | null;
  proximoServicioFecha: string | null;
  realizadoPor: string | null;
  notas: string | null;
  usuarioNombre: string;
  createdAt: string;
}

const TIPO_MANTENIMIENTO: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  preventivo:  { label: "Preventivo",   bg: "bg-blue-50",   text: "text-blue-700",   icon: CheckCircle2 },
  correctivo:  { label: "Correctivo",   bg: "bg-red-50",    text: "text-red-700",    icon: Wrench },
  revision:    { label: "Revisión",     bg: "bg-emerald-50",text: "text-emerald-700",icon: ClipboardList },
  reparacion:  { label: "Reparación",   bg: "bg-amber-50",  text: "text-amber-700",  icon: Wrench },
  otro:        { label: "Otro",         bg: "bg-slate-50",  text: "text-slate-700",  icon: FileText },
};

export default function MantenimientoUnidadesPage() {
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [filtroUnidad, setFiltroUnidad] = useState<string>("");
  const [filtroTipo, setFiltroTipo] = useState<string>("");

  const [formData, setFormData] = useState({
    unidadId: "",
    fecha: new Date().toISOString().split("T")[0],
    tipoMantenimiento: "preventivo",
    descripcion: "",
    km: "",
    costo: "",
    proximoServicioKm: "",
    proximoServicioFecha: "",
    realizadoPor: "",
    notas: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, uRes] = await Promise.all([
        fetch("/api/unidades-mantenimiento"),
        fetch("/api/unidades"),
      ]);
      const mData = await mRes.json();
      const uData = await uRes.json();

      setMantenimientos(mData.success ? mData.mantenimientos : []);

      const unidadesNorm = (Array.isArray(uData) ? uData : []).map((u: any) => ({
        id: u.id,
        numeroUnidad: u.numeroUnidad,
        placa: u.placa,
        marca: u.marca,
        modelo: u.modelo,
        kmActual: u.kmActual ?? null,
        ultimoMantenimiento: u.ultimoMantenimiento ?? null,
        proximoMantenimiento: u.proximoMantenimiento ?? null,
        proximoMantenimientoKm: u.proximoMantenimientoKm ?? null,
      }));
      setUnidades(unidadesNorm);
    } catch (err) {
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const mantenimientosFiltrados = useMemo(() => {
    return mantenimientos.filter((m) => {
      if (filtroUnidad && String(m.unidadId) !== filtroUnidad) return false;
      if (filtroTipo && m.tipoMantenimiento !== filtroTipo) return false;
      return true;
    });
  }, [mantenimientos, filtroUnidad, filtroTipo]);

  // Smart alerts
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
      } else {
        const ult = new Date(u.ultimoMantenimiento);
        const diffDays = Math.floor((hoy.getTime() - ult.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 180) vencidos.push(u);
        else if (diffDays > 90) porVencer.push(u);
      }
    });

    return { vencidos, porVencer, sinRegistro };
  }, [unidades]);

  // Smart stats
  const stats = useMemo(() => {
    const total = mantenimientos.length;
    const costoTotal = mantenimientos.reduce((acc, m) => acc + (Number(m.costo) || 0), 0);
    const costoMes = mantenimientos
      .filter((m) => {
        const d = new Date(m.fecha);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, m) => acc + (Number(m.costo) || 0), 0);
    const ultimos30 = mantenimientos.filter((m) => {
      const d = new Date(m.fecha);
      const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    }).length;
    return { total, costoTotal, costoMes, ultimos30 };
  }, [mantenimientos]);

  const openModalNuevo = (unidadIdPre?: number) => {
    setFormData({
      unidadId: unidadIdPre ? String(unidadIdPre) : "",
      fecha: new Date().toISOString().split("T")[0],
      tipoMantenimiento: "preventivo",
      descripcion: "",
      km: "",
      costo: "",
      proximoServicioKm: "",
      proximoServicioFecha: "",
      realizadoPor: "",
      notas: "",
    });
    setEditingId(null);
    setIsEditing(false);
    setError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (m: Mantenimiento) => {
    setFormData({
      unidadId: String(m.unidadId),
      fecha: m.fecha.split("T")[0],
      tipoMantenimiento: m.tipoMantenimiento,
      descripcion: m.descripcion,
      km: m.km != null ? String(m.km) : "",
      costo: m.costo != null ? String(m.costo) : "",
      proximoServicioKm: m.proximoServicioKm != null ? String(m.proximoServicioKm) : "",
      proximoServicioFecha: m.proximoServicioFecha ? m.proximoServicioFecha.split("T")[0] : "",
      realizadoPor: m.realizadoPor || "",
      notas: m.notas || "",
    });
    setEditingId(m.id);
    setIsEditing(true);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unidadId || !formData.fecha || !formData.descripcion) {
      setError("Unidad, fecha y descripción son obligatorios");
      return;
    }

    try {
      const payload = {
        ...(isEditing && editingId ? { id: editingId } : {}),
        unidadId: Number(formData.unidadId),
        fecha: formData.fecha,
        tipoMantenimiento: formData.tipoMantenimiento,
        descripcion: formData.descripcion,
        km: formData.km ? Number(formData.km) : null,
        costo: formData.costo ? Number(formData.costo) : null,
        proximoServicioKm: formData.proximoServicioKm ? Number(formData.proximoServicioKm) : null,
        proximoServicioFecha: formData.proximoServicioFecha || null,
        realizadoPor: formData.realizadoPor || null,
        notas: formData.notas || null,
      };

      const res = await fetch("/api/unidades-mantenimiento", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Error al guardar");

      await fetchData();
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este registro de mantenimiento?")) return;
    try {
      await fetch(`/api/unidades-mantenimiento?id=${id}`, { method: "DELETE" });
      await fetchData();
    } catch (err) {
      setError("No se pudo eliminar");
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("es-VE", { style: "currency", currency: "VES" }).format(v);

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" });
  };

  const diasDesde = (fecha: string) => {
    const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Hoy";
    if (diff === 1) return "Ayer";
    if (diff < 30) return `Hace ${diff} días`;
    if (diff < 365) return `Hace ${Math.floor(diff / 30)} meses`;
    return `Hace ${Math.floor(diff / 365)} año(s)`;
  };

  const inputCls = "w-full px-3 sm:px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all shadow-sm placeholder:text-slate-400 bg-white";

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Wrench className="text-slate-700" size={28} />
            Mantenimiento de Unidades
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Sistema inteligente de gestión de mantenimiento vehicular.</p>
        </div>
        <button
          onClick={() => openModalNuevo()}
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm px-5 py-2.5 flex items-center justify-center gap-2 transition-all font-medium"
        >
          <Plus size={18} />
          Nuevo Mantenimiento
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 text-sm font-medium border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Registros</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <History size={20} className="text-slate-700" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Últimos 30 días</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{stats.ultimos30}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Costo del Mes</p>
              <p className="text-lg sm:text-xl font-extrabold text-blue-600 mt-1">{formatCurrency(stats.costoMes)}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <DollarSign size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Costo Total</p>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">{formatCurrency(stats.costoTotal)}</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Activity size={20} className="text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ALERTAS */}
      {(alertas.vencidos.length > 0 || alertas.porVencer.length > 0 || alertas.sinRegistro.length > 0) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-amber-600" size={20} />
            <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide">Alertas Inteligentes</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {alertas.vencidos.length > 0 && (
              <div className="bg-white border-l-4 border-red-500 rounded-xl p-3 shadow-sm">
                <p className="text-xs font-bold text-red-700 uppercase mb-1.5 flex items-center gap-1">
                  <Clock size={12} /> Mantenimiento Vencido
                </p>
                {alertas.vencidos.slice(0, 3).map((u) => (
                  <div key={u.id} className="text-xs text-slate-700 py-1 flex items-center justify-between">
                    <span><strong>{u.numeroUnidad}</strong> · {u.placa}</span>
                    <button onClick={() => openModalNuevo(u.id)} className="text-blue-600 hover:underline font-medium">Registrar</button>
                  </div>
                ))}
                {alertas.vencidos.length > 3 && (
                  <p className="text-[10px] text-slate-500 mt-1">+{alertas.vencidos.length - 3} más</p>
                )}
              </div>
            )}
            {alertas.porVencer.length > 0 && (
              <div className="bg-white border-l-4 border-amber-500 rounded-xl p-3 shadow-sm">
                <p className="text-xs font-bold text-amber-700 uppercase mb-1.5 flex items-center gap-1">
                  <AlertTriangle size={12} /> Por Vencer
                </p>
                {alertas.porVencer.slice(0, 3).map((u) => (
                  <div key={u.id} className="text-xs text-slate-700 py-1 flex items-center justify-between">
                    <span><strong>{u.numeroUnidad}</strong> · {u.placa}</span>
                    <button onClick={() => openModalNuevo(u.id)} className="text-blue-600 hover:underline font-medium">Programar</button>
                  </div>
                ))}
              </div>
            )}
            {alertas.sinRegistro.length > 0 && (
              <div className="bg-white border-l-4 border-slate-400 rounded-xl p-3 shadow-sm">
                <p className="text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">
                  <FileText size={12} /> Sin Registro
                </p>
                {alertas.sinRegistro.slice(0, 3).map((u) => (
                  <div key={u.id} className="text-xs text-slate-700 py-1 flex items-center justify-between">
                    <span><strong>{u.numeroUnidad}</strong> · {u.placa}</span>
                    <button onClick={() => openModalNuevo(u.id)} className="text-blue-600 hover:underline font-medium">Crear</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FILTROS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Unidad</label>
          <select value={filtroUnidad} onChange={(e) => setFiltroUnidad(e.target.value)} className={inputCls}>
            <option value="">Todas las unidades</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>{u.numeroUnidad} · {u.placa} · {u.marca} {u.modelo}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Tipo</label>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className={inputCls}>
            <option value="">Todos los tipos</option>
            <option value="preventivo">Preventivo</option>
            <option value="correctivo">Correctivo</option>
            <option value="revision">Revisión</option>
            <option value="reparacion">Reparación</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        {(filtroUnidad || filtroTipo) && (
          <div className="flex items-end">
            <button onClick={() => { setFiltroUnidad(""); setFiltroTipo(""); }} className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* LISTADO */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" size={32} /><p className="mt-3 text-slate-500">Cargando mantenimientos...</p></div>
        ) : mantenimientosFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Sin mantenimientos registrados</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">Registra el primer mantenimiento de una unidad para comenzar.</p>
            <button onClick={() => openModalNuevo()} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium">
              <Plus size={16} className="inline mr-1" /> Registrar mantenimiento
            </button>
          </div>
        ) : (
          <>
            {/* MOBILE: Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {mantenimientosFiltrados.map((m) => {
                const tipo = TIPO_MANTENIMIENTO[m.tipoMantenimiento] || TIPO_MANTENIMIENTO.otro;
                const Icon = tipo.icon;
                return (
                  <div key={m.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${tipo.bg} ${tipo.text}`}>
                          <Icon size={11} />
                          {tipo.label}
                        </span>
                        <span className="text-xs text-slate-500">{formatDate(m.fecha)}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(m)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-900">#{m.unidadNumero}</span>
                      <span className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{m.unidadPlaca}</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2 line-clamp-2">{m.descripcion}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
                      {m.km != null && <span><Gauge size={10} className="inline" /> {Number(m.km).toLocaleString("es-VE")} km</span>}
                      {m.costo != null && <span className="font-semibold text-emerald-700">{formatCurrency(Number(m.costo))}</span>}
                      {m.realizadoPor && <span>· {m.realizadoPor}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP: Tabla */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Fecha</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Unidad</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Tipo</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Descripción</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Km</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Costo</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Realizado por</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {mantenimientosFiltrados.map((m) => {
                    const tipo = TIPO_MANTENIMIENTO[m.tipoMantenimiento] || TIPO_MANTENIMIENTO.otro;
                    const Icon = tipo.icon;
                    return (
                      <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                          <div className="text-xs font-semibold">{formatDate(m.fecha)}</div>
                          <div className="text-[10px] text-slate-400">{diasDesde(m.fecha)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                              <Truck size={12} className="text-slate-600" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs">#{m.unidadNumero}</div>
                              <div className="text-[10px] font-mono text-blue-600">{m.unidadPlaca}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${tipo.bg} ${tipo.text}`}>
                            <Icon size={10} />
                            {tipo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-slate-700 text-xs line-clamp-2">{m.descripcion}</p>
                          {m.notas && <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">📝 {m.notas}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-700 whitespace-nowrap">
                          {m.km != null ? <span className="flex items-center gap-1"><Gauge size={11} />{Number(m.km).toLocaleString("es-VE")}</span> : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-emerald-700 whitespace-nowrap">
                          {m.costo != null ? formatCurrency(Number(m.costo)) : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                          {m.realizadoPor || <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(m)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(m.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {isEditing ? "Editar mantenimiento" : "Nuevo mantenimiento"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {isEditing ? "Modifica los datos del mantenimiento." : "Registra un nuevo mantenimiento para una unidad."}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-5 sm:p-8 space-y-5">
                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-800 p-3 rounded-xl">
                    <AlertCircle size={18} className="text-red-500 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="col-span-2 sm:col-span-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unidad *</label>
                    <select required value={formData.unidadId} onChange={(e) => setFormData({ ...formData, unidadId: e.target.value })} className={inputCls}>
                      <option value="">Seleccionar unidad...</option>
                      {unidades.map((u) => (
                        <option key={u.id} value={u.id}>{u.numeroUnidad} · {u.placa} · {u.marca} {u.modelo}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 sm:col-span-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha *</label>
                    <input type="date" required value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} className={inputCls} />
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo de mantenimiento *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {Object.entries(TIPO_MANTENIMIENTO).map(([key, val]) => {
                        const active = formData.tipoMantenimiento === key;
                        const Icon = val.icon;
                        return (
                          <button key={key} type="button" onClick={() => setFormData({ ...formData, tipoMantenimiento: key })}
                            className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 hover:border-slate-400 bg-white text-slate-700"}`}>
                            <Icon size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{val.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Descripción *</label>
                    <textarea required rows={2} value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} placeholder="Ej: Cambio de aceite y filtros, revisión de frenos..." className={`${inputCls} resize-none`} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kilometraje</label>
                    <div className="relative">
                      <Gauge size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input type="number" step="0.01" min="0" value={formData.km} onChange={(e) => setFormData({ ...formData, km: e.target.value })} placeholder="0" className={`${inputCls} pl-11`} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Costo (Bs.)</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input type="number" step="0.01" min="0" value={formData.costo} onChange={(e) => setFormData({ ...formData, costo: e.target.value })} placeholder="0.00" className={`${inputCls} pl-11`} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Próx. Servicio (Km)</label>
                    <input type="number" step="0.01" min="0" value={formData.proximoServicioKm} onChange={(e) => setFormData({ ...formData, proximoServicioKm: e.target.value })} placeholder="50000" className={inputCls} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Próx. Servicio (Fecha)</label>
                    <input type="date" value={formData.proximoServicioFecha} onChange={(e) => setFormData({ ...formData, proximoServicioFecha: e.target.value })} className={inputCls} />
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Realizado por</label>
                    <input type="text" value={formData.realizadoPor} onChange={(e) => setFormData({ ...formData, realizadoPor: e.target.value })} placeholder="Ej: Taller mecánico, Roberto Quintero..." className={inputCls} />
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notas adicionales</label>
                    <textarea rows={2} value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} placeholder="Observaciones, repuestos usados, garantía..." className={`${inputCls} resize-none`} />
                  </div>
                </div>
              </div>

              <div className="px-5 sm:px-8 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3 bg-white shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                  {isEditing ? "Guardar cambios" : "Registrar mantenimiento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}