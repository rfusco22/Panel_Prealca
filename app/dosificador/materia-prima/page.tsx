"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, X, CheckCircle2 } from "lucide-react";
import { useSocket } from '@/contexts/SocketContext';

export default function MateriaPrimaPage() {
  const { socket } = useSocket();
  const [agregados, setAgregados] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [materiaPrima, setMateriaPrima] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

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
    es_saldo_inicial: false,
  });

  const getMaxDate = () => getLocalDate();
  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().split("T")[0];
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

    return () => {
      socket.off('materia-prima:created', handleUpdate);
    };
  }, [socket]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [aggRes, mpRes, pvRes] = await Promise.all([
        fetch("/api/agregados"),
        fetch("/api/materia-prima"),
        fetch("/api/proveedores"),
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
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/materia-prima", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agregado_id: parseInt(form.agregado_id),
          cantidad: parseFloat(form.cantidad),
          unidad: getUnidadByAgregado(form.agregado_id),
          fecha: form.fecha,
          proveedor_id: parseInt(form.proveedor_id),
          es_saldo_inicial: form.es_saldo_inicial,
          usuario_id: 1,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al registrar");
      }
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsModalOpen(false);
        setForm({ agregado_id: "", cantidad: "", fecha: getLocalDate(), proveedor_id: "", es_saldo_inicial: false });
        fetchData();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
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
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm px-5 py-2.5 flex items-center gap-2 transition-all font-medium"
        >
          <Plus size={18} />
          Nuevo Registro
        </button>
      </div>

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
                  <th className="px-6 py-4">Cantidad</th>
                  <th className="px-6 py-4">Unidad</th>
                  <th className="px-6 py-4">Tipo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materiaPrima.map((mp) => (
                  <tr key={mp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {new Date(mp.fecha || mp.created_at).toLocaleDateString("es-VE")}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {mp.proveedor_nombre ? `${mp.proveedor_nombre}${mp.proveedor_planta ? ` - ${mp.proveedor_planta}` : ''} - ${mp.agregado_nombre}` : mp.agregado_nombre}
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
                <h3 className="text-xl font-black text-slate-900">Registrado</h3>
              </div>
            )}

            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Registrar Materia Prima</h3>
                <p className="text-sm text-slate-500 mt-1">Selecciona el agregado y la cantidad.</p>
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
                  min={getMinDate()}
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
                  onChange={(e) => setForm({ ...form, proveedor_id: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Seleccionar proveedor...</option>
                  {proveedores.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}{p.planta ? ` - ${p.planta}` : ''}
                    </option>
                  ))}
                </select>
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
                  {isSubmitting ? "Registrando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
