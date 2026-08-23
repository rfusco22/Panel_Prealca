"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, X, CheckCircle2, Trash2, Package } from "lucide-react";

interface Agregado {
  id: number;
  nombre: string;
  unidad_medida: string;
}

interface SaldoInicial {
  id: number;
  agregado_id: number;
  cantidad: number;
  fecha: string;
  agregado_nombre: string;
  unidad_medida: string;
}

export default function SaldoInicialPage() {
  const [agregados, setAgregados] = useState<Agregado[]>([]);
  const [saldos, setSaldos] = useState<SaldoInicial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    agregado_id: "",
    cantidad: "",
    fecha: getLocalDate(),
  });

  function getLocalDate() {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().split("T")[0];
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [aggRes, saldoRes] = await Promise.all([
        fetch("/api/agregados"),
        fetch("/api/saldo-inicial"),
      ]);
      if (aggRes.ok) {
        const aggData = await aggRes.json();
        setAgregados(Array.isArray(aggData) ? aggData : (aggData.agregados || aggData.data || []));
      }
      if (saldoRes.ok) {
        const saldoData = await saldoRes.json();
        setSaldos(saldoData.saldos || []);
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
      const res = await fetch("/api/saldo-inicial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agregado_id: parseInt(form.agregado_id),
          cantidad: parseFloat(form.cantidad),
          fecha: form.fecha,
          usuario_id: 1,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsModalOpen(false);
        setForm({ agregado_id: "", cantidad: "", fecha: getLocalDate() });
        fetchData();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este saldo inicial?")) return;
    try {
      await fetch(`/api/saldo-inicial?id=${id}`, { method: "DELETE" });
      fetchData();
    } catch {}
  };

  const inputCls = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 shadow-sm transition-all bg-white appearance-none cursor-pointer";
  const labelCls = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Package size={28} className="text-blue-600" />
            Saldo Inicial
          </h1>
          <p className="text-slate-500 mt-1">Configurar el saldo inicial de cada agregado en el sistema.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm px-5 py-2.5 flex items-center gap-2 transition-all font-medium"
        >
          <Plus size={18} />
          Nuevo Saldo
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <Loader2 size={24} className="animate-spin text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-sm">Cargando saldos...</p>
        </div>
      ) : saldos.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <Package size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No hay saldos iniciales configurados.</p>
          <p className="text-slate-400 text-sm mt-1">Haz clic en "Nuevo Saldo" para comenzar.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Agregado</th>
                  <th className="px-6 py-4">Saldo Inicial</th>
                  <th className="px-6 py-4">Unidad</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {saldos.map((saldo) => (
                  <tr key={saldo.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{saldo.agregado_nombre}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {Number(saldo.cantidad).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-bold">
                        {saldo.unidad_medida}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      {new Date(saldo.fecha).toLocaleDateString("es-VE")}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(saldo.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
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
                <h3 className="text-xl font-black text-slate-900">Guardado</h3>
              </div>
            )}

            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Registrar Saldo Inicial</h3>
                <p className="text-sm text-slate-500 mt-1">Define el saldo inicial de cada agregado.</p>
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
                <label className={labelCls}>Agregado *</label>
                <select
                  required
                  value={form.agregado_id}
                  onChange={(e) => setForm({ ...form, agregado_id: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Seleccionar agregado...</option>
                  {agregados.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre} — {a.unidad_medida}</option>
                  ))}
                </select>
              </div>

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
                <label className={labelCls}>Fecha *</label>
                <input
                  type="date"
                  required
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
