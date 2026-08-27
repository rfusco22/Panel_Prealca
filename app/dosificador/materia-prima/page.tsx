"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, X, CheckCircle2, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/hooks/useAuth';

export default function MateriaPrimaPage() {
  const { socket } = useSocket();
  const { session } = useAuth();
  // Esta misma página la sirve /admin/materia-prima, que la reexporta. Editar y
  // eliminar son solo para admin, igual que en el API.
  const puedeGestionar = session?.user.role === 'admin';

  const [agregados, setAgregados] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [choferes, setChoferes] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [materiaPrima, setMateriaPrima] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  // null = alta; un id = edición de ese registro
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [aEliminar, setAEliminar] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getLocalDate = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().split("T")[0];
  };

  const [form, setForm] = useState({
    agregado_id: "",
    cantidad: "",
    fecha: getLocalDate(),
    proveedor_id: "",
    planta_id: "",
    chofer_id: "",
    unidad_id: "",
    es_saldo_inicial: false,
  });

  const formVacio = {
    agregado_id: "",
    cantidad: "",
    fecha: getLocalDate(),
    proveedor_id: "",
    planta_id: "",
    chofer_id: "",
    unidad_id: "",
    es_saldo_inicial: false,
  };

  // Plantas del proveedor elegido. Vienen dentro de cada proveedor desde
  // /api/proveedores, que ya hace el join con proveedor_plantas.
  const proveedorSeleccionado = proveedores.find(
    (p: any) => String(p.id) === form.proveedor_id
  );
  const plantasDelProveedor: any[] = proveedorSeleccionado?.plantas || [];

  // Un saldo inicial es un ajuste de arranque: no hay despacho, así que no se
  // exige chofer ni unidad.
  const requiereDespacho = !form.es_saldo_inicial;

  const getMaxDate = () => getLocalDate();
  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().split("T")[0];
  };

  // El alta se limita a los últimos 30 días. Al editar un registro más viejo esa
  // cota lo dejaría inguardable, así que se corre hasta la fecha del registro.
  const getMinDateForm = () => {
    const min = getMinDate();
    if (editandoId !== null && form.fecha && form.fecha < min) return form.fecha;
    return min;
  };

  const getUnidadByAgregado = (id: string) => {
    const agg = agregados.find((a: any) => String(a.id) === id);
    return agg ? (agg.unidadMedida || agg.unidad_medida) : "";
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchData();
    };

    socket.on('materia-prima:created', handleUpdate);
    socket.on('materia-prima:updated', handleUpdate);
    socket.on('materia-prima:deleted', handleUpdate);

    return () => {
      socket.off('materia-prima:created', handleUpdate);
      socket.off('materia-prima:updated', handleUpdate);
      socket.off('materia-prima:deleted', handleUpdate);
    };
  }, [socket]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [aggRes, mpRes, pvRes, chRes, unRes] = await Promise.all([
        fetch("/api/agregados"),
        fetch("/api/materia-prima"),
        fetch("/api/proveedores"),
        fetch("/api/choferes"),
        fetch("/api/unidades"),
      ]);
      if (aggRes.ok) {
        const aggData = await aggRes.json();
        setAgregados(Array.isArray(aggData) ? aggData : (aggData.agregados || aggData.data || []));
      }
      if (mpRes.ok) {
        const mpData = await mpRes.json();
        setMateriaPrima(Array.isArray(mpData) ? mpData : (mpData.materiaPrima || mpData.data || []));
      }
      if (pvRes.ok) {
        const pvData = await pvRes.json();
        setProveedores(pvData.proveedores || pvData.data || []);
      }
      if (chRes.ok) {
        const chData = await chRes.json();
        setChoferes(Array.isArray(chData) ? chData : (chData.choferes || chData.data || []));
      }
      if (unRes.ok) {
        const unData = await unRes.json();
        setUnidades(Array.isArray(unData) ? unData : (unData.unidades || unData.data || []));
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const abrirNuevo = () => {
    setEditandoId(null);
    setError("");
    setForm({ ...formVacio, fecha: getLocalDate() });
    setIsModalOpen(true);
  };

  const abrirEditar = (mp: any) => {
    setEditandoId(mp.id);
    setError("");
    setForm({
      agregado_id: mp.agregado_id ? String(mp.agregado_id) : "",
      cantidad: mp.cantidad != null ? String(mp.cantidad) : "",
      // El input date necesita YYYY-MM-DD; la API puede devolver un datetime.
      fecha: mp.fecha ? String(mp.fecha).split("T")[0].slice(0, 10) : getLocalDate(),
      proveedor_id: mp.proveedor_id ? String(mp.proveedor_id) : "",
      planta_id: mp.planta_id ? String(mp.planta_id) : "",
      chofer_id: mp.chofer_id ? String(mp.chofer_id) : "",
      unidad_id: mp.unidad_id ? String(mp.unidad_id) : "",
      es_saldo_inicial: !!mp.es_saldo_inicial,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    const esEdicion = editandoId !== null;
    try {
      const res = await fetch("/api/materia-prima", {
        method: esEdicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(esEdicion ? { id: editandoId } : {}),
          agregado_id: parseInt(form.agregado_id),
          cantidad: parseFloat(form.cantidad),
          unidad: getUnidadByAgregado(form.agregado_id),
          fecha: form.fecha,
          proveedor_id: parseInt(form.proveedor_id),
          planta_id: form.planta_id ? parseInt(form.planta_id) : null,
          chofer_id: form.chofer_id ? parseInt(form.chofer_id) : null,
          unidad_id: form.unidad_id ? parseInt(form.unidad_id) : null,
          es_saldo_inicial: form.es_saldo_inicial,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || (esEdicion ? "Error al actualizar" : "Error al registrar"));
      }
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsModalOpen(false);
        setEditandoId(null);
        setForm({ ...formVacio, fecha: getLocalDate() });
        fetchData();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!aEliminar) return;
    setIsDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/materia-prima?id=${aEliminar.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar");
      }
      setAEliminar(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
      setAEliminar(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 shadow-sm transition-all bg-white appearance-none cursor-pointer";
  const labelCls = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Materia Prima</h1>
          <p className="text-slate-500 mt-1">Registrar cantidades de materia prima y agregados.</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm px-5 py-2.5 flex items-center gap-2 transition-all font-medium"
        >
          <Plus size={18} />
          Nuevo Registro
        </button>
      </div>

      {!isModalOpen && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-700 p-1">
            <X size={16} />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <Loader2 size={24} className="animate-spin text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-sm">Cargando registros...</p>
        </div>
      ) : materiaPrima.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <p className="text-slate-500 font-medium">No hay registros de materia prima.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Proveedor - Agregado</th>
                  <th className="px-6 py-4">Chofer</th>
                  <th className="px-6 py-4">Unidad Transporte</th>
                  <th className="px-6 py-4">Cantidad</th>
                  <th className="px-6 py-4">Unidad</th>
                  <th className="px-6 py-4">Tipo</th>
                  {puedeGestionar && <th className="px-6 py-4 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materiaPrima.map((mp) => (
                  <tr key={mp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {new Date(mp.fecha || mp.created_at).toLocaleDateString("es-VE")}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {mp.proveedor_nombre
                        ? `${mp.proveedor_nombre}${mp.planta_nombre || mp.proveedor_planta ? ` - ${mp.planta_nombre || mp.proveedor_planta}` : ''} - ${mp.agregado_nombre}`
                        : mp.agregado_nombre}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {mp.chofer_nombre || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {mp.unidad_numero || mp.unidad_placa
                        ? `${mp.unidad_numero || ''}${mp.unidad_numero && mp.unidad_placa ? ' — ' : ''}${mp.unidad_placa || ''}`
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {Number(mp.cantidad).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-bold">
                        {mp.unidad}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {mp.es_saldo_inicial ? (
                        <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold">
                          Saldo Inicial
                        </span>
                      ) : (
                        <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-xs font-bold">
                          Registro
                        </span>
                      )}
                    </td>
                    {puedeGestionar && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => abrirEditar(mp)}
                            title="Editar registro"
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setAEliminar(mp)}
                            title="Eliminar registro"
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {showSuccess && (
              <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center">
                <div className="bg-emerald-100 text-emerald-500 p-4 rounded-full mb-4 animate-bounce">
                  <CheckCircle2 size={48} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-black text-slate-900">{editandoId !== null ? "Actualizado" : "Registrado"}</h3>
              </div>
            )}

            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editandoId !== null ? "Editar Materia Prima" : "Registrar Materia Prima"}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {editandoId !== null
                    ? "Corregí los datos del registro."
                    : "Selecciona el agregado y la cantidad."}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className={labelCls}>Fecha *</label>
                <input
                  type="date"
                  required
                  value={form.fecha}
                  min={getMinDateForm()}
                  max={getMaxDate()}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Proveedor *</label>
                <select
                  required
                  value={form.proveedor_id}
                  onChange={(e) => setForm({ ...form, proveedor_id: e.target.value, planta_id: "" })}
                  className={inputCls}
                >
                  <option value="">Seleccionar proveedor...</option>
                  {proveedores.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>
                  Planta {plantasDelProveedor.length > 0 ? "*" : ""}
                </label>
                <select
                  required={plantasDelProveedor.length > 0}
                  disabled={!form.proveedor_id || plantasDelProveedor.length === 0}
                  value={form.planta_id}
                  onChange={(e) => setForm({ ...form, planta_id: e.target.value })}
                  className={`${inputCls} disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`}
                >
                  <option value="">
                    {!form.proveedor_id
                      ? "Seleccioná un proveedor primero..."
                      : plantasDelProveedor.length === 0
                        ? "Este proveedor no tiene plantas registradas"
                        : "Seleccionar planta..."}
                  </option>
                  {plantasDelProveedor.map((pl: any) => (
                    <option key={pl.id} value={pl.id}>{pl.nombre}</option>
                  ))}
                </select>
                {form.proveedor_id && plantasDelProveedor.length === 0 && (
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Podés cargarle plantas a este proveedor desde el módulo de Proveedores.
                  </p>
                )}
              </div>

              <div>
                <label className={labelCls}>Agregado *</label>
                <select
                  required
                  value={form.agregado_id}
                  onChange={(e) => setForm({ ...form, agregado_id: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Seleccionar agregado...</option>
                  {agregados.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.nombre} — {a.unidadMedida || a.unidad_medida}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Cantidad *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.cantidad}
                    onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                    className={inputCls}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={labelCls}>Unidad</label>
                  <input
                    type="text"
                    readOnly
                    value={form.agregado_id ? getUnidadByAgregado(form.agregado_id) : ""}
                    className={`${inputCls} bg-slate-50 cursor-not-allowed font-bold text-slate-900`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Chofer {requiereDespacho ? "*" : ""}</label>
                  <select
                    required={requiereDespacho}
                    value={form.chofer_id}
                    onChange={(e) => setForm({ ...form, chofer_id: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Seleccionar chofer...</option>
                    {choferes.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}{c.cedula ? ` — ${c.cedula}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Unidad {requiereDespacho ? "*" : ""}</label>
                  <select
                    required={requiereDespacho}
                    value={form.unidad_id}
                    onChange={(e) => setForm({ ...form, unidad_id: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Seleccionar unidad...</option>
                    {unidades.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.numeroUnidad || u.numero_unidad || `Unidad ${u.id}`}
                        {u.placa ? ` — ${u.placa}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <input
                  type="checkbox"
                  id="es_saldo_inicial"
                  checked={form.es_saldo_inicial}
                  onChange={(e) => setForm({ ...form, es_saldo_inicial: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="es_saldo_inicial" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Saldo Inicial
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {isSubmitting
                    ? (editandoId !== null ? "Guardando..." : "Registrando...")
                    : (editandoId !== null ? "Guardar cambios" : "Registrar")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {aEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isDeleting && setAEliminar(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex items-start gap-4">
                <div className="bg-red-50 text-red-600 p-3 rounded-full shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Eliminar registro</h3>
                  <p className="text-sm text-slate-500 mt-1.5">
                    Se va a eliminar{" "}
                    <span className="font-bold text-slate-700">
                      {Number(aEliminar.cantidad).toLocaleString("es-VE", { minimumFractionDigits: 2 })} {aEliminar.unidad}
                    </span>{" "}
                    de <span className="font-bold text-slate-700">{aEliminar.agregado_nombre}</span>
                    {aEliminar.proveedor_nombre ? ` (${aEliminar.proveedor_nombre})` : ""}.
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Esto descuenta esa cantidad del stock y no se puede deshacer.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAEliminar(null)}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting && <Loader2 size={14} className="animate-spin" />}
                  {isDeleting ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
