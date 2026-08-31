"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

interface ChoferFormProps {
  onClose?: () => void;
  initialData?: any;
  isEditing?: boolean;
}

function ChoferForm({ onClose, initialData, isEditing }: ChoferFormProps) {
  const [form, setForm] = useState({
    nombre: initialData?.nombre || "",
    cedula: initialData?.cedula || "",
    telefono: initialData?.telefono || "",
    correo: initialData?.correo || "",
    direccion: initialData?.direccion || "",
    rif: initialData?.rif || "",
    rif_vencimiento: initialData?.rif_vencimiento?.split("T")[0] || "",
    licencia_documento: initialData?.licencia_documento || "",
    licencia_vencimiento: initialData?.licencia_vencimiento?.split("T")[0] || "",
    certificado_documento: initialData?.certificado_documento || "",
    certificado_vencimiento: initialData?.certificado_vencimiento?.split("T")[0] || "",
    estado: initialData?.estado || "activo",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const method = isEditing ? "PUT" : "POST";
      const body = isEditing ? { ...form, id: initialData.id } : form;
      const res = await fetch("/api/choferes", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }
      setShowSuccess(true);
      setTimeout(() => { if (onClose) onClose(); }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 shadow-sm transition-all bg-white";
  const labelCls = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";
  const smallLabel = "block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1";

  return (
    <form onSubmit={handleSubmit} className="p-5 sm:p-8">
      {showSuccess && (
        <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center rounded-2xl">
          <div className="bg-emerald-100 text-emerald-500 p-4 rounded-full mb-4 animate-bounce">
            <CheckCircle2 size={48} strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-black text-slate-900">{isEditing ? "Actualizado" : "Registrado"}</h3>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
            Datos Personales
          </h4>
          <div>
            <label className={labelCls}>Nombre y Apellido *</label>
            <input type="text" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className={inputCls} placeholder="Ej: Juan Pérez" />
          </div>
          <div>
            <label className={labelCls}>Cédula *</label>
            <div className="flex gap-2">
              <select value={form.cedula.split("-")[0] === "V" || form.cedula.split("-")[0] === "E" ? form.cedula.split("-")[0] : ""} onChange={(e) => { const num = form.cedula.includes("-") ? form.cedula.split("-")[1] : form.cedula; setForm({ ...form, cedula: `${e.target.value}-${num}` }); }} className="w-[70px] px-2 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-800 bg-white">
                <option value="V">V</option>
                <option value="E">E</option>
              </select>
              <input type="text" required value={form.cedula.includes("-") ? form.cedula.split("-")[1] : form.cedula} onChange={(e) => { const prefijo = form.cedula.split("-")[0] || "V"; setForm({ ...form, cedula: `${prefijo}-${e.target.value.replace(/[^0-9]/g, "")}` }); }} className={`${inputCls} flex-1`} placeholder="12345678" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Dirección</label>
            <input type="text" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} className={inputCls} placeholder="Dirección completa" />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
            <h5 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">RIF</h5>
            <div>
              <label className={smallLabel}>Número de RIF</label>
              <div className="flex gap-2">
                <select value={form.rif ? form.rif.split("-")[0] : ""} onChange={(e) => { const num = form.rif.includes("-") ? form.rif.split("-").slice(1).join("-") : ""; setForm({ ...form, rif: num ? `${e.target.value}-${num}` : "" }); }} className="w-[70px] px-2 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-800 bg-white">
                  <option value="V">V</option>
                  <option value="J">J</option>
                  <option value="G">G</option>
                  <option value="E">E</option>
                  <option value="P">P</option>
                </select>
                <input type="text" value={form.rif ? form.rif.split("-").slice(1).join("-") : ""} onChange={(e) => { const prefijo = form.rif.split("-")[0] || "V"; setForm({ ...form, rif: `${prefijo}-${e.target.value.replace(/[^0-9\-]/g, "")}` }); }} className={`${inputCls} flex-1`} placeholder="12345678" />
              </div>
            </div>
            <div>
              <label className={smallLabel}>Fecha Vencimiento</label>
              <input type="date" value={form.rif_vencimiento} onChange={(e) => setForm({ ...form, rif_vencimiento: e.target.value })} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
            Contacto y Documentos
          </h4>
          <div>
            <label className={labelCls}>Teléfono *</label>
            <div className="flex gap-2">
              <select value={form.telefono.split("-")[0] || ""} onChange={(e) => { const num = form.telefono.includes("-") ? form.telefono.split("-")[1] : form.telefono; setForm({ ...form, telefono: `${e.target.value}-${num}` }); }} className="w-[90px] px-2 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-800 bg-white">
                <option value="0412">0412</option>
                <option value="0414">0414</option>
                <option value="0416">0416</option>
                <option value="0424">0424</option>
                <option value="0426">0426</option>
              </select>
              <input type="text" required value={form.telefono.includes("-") ? form.telefono.split("-")[1] : form.telefono} onChange={(e) => { const prefijo = form.telefono.split("-")[0] || "0412"; setForm({ ...form, telefono: `${prefijo}-${e.target.value.replace(/[^0-9]/g, "").slice(0, 7)}` }); }} className={`${inputCls} flex-1`} placeholder="0000000" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Correo *</label>
            <input type="email" required value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} className={inputCls} placeholder="correo@ejemplo.com" />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
            <h5 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Licencia de Conducir</h5>
            <div>
              <label className={smallLabel}>Nro. Documento</label>
              <input type="text" value={form.licencia_documento} onChange={(e) => setForm({ ...form, licencia_documento: e.target.value })} className={inputCls} placeholder="Nro. licencia" />
            </div>
            <div>
              <label className={smallLabel}>Fecha Vencimiento</label>
              <input type="date" value={form.licencia_vencimiento} onChange={(e) => setForm({ ...form, licencia_vencimiento: e.target.value })} className={inputCls} />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
            <h5 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Certificado Médico</h5>
            <div>
              <label className={smallLabel}>Nro. Documento</label>
              <input type="text" value={form.certificado_documento} onChange={(e) => setForm({ ...form, certificado_documento: e.target.value })} className={inputCls} placeholder="Nro. certificado" />
            </div>
            <div>
              <label className={smallLabel}>Fecha Vencimiento</label>
              <input type="date" value={form.certificado_vencimiento} onChange={(e) => setForm({ ...form, certificado_vencimiento: e.target.value })} className={inputCls} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 w-full sm:w-auto">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto">
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Registrar Chofer"}
        </button>
      </div>
    </form>
  );
}

export { ChoferForm };
export default ChoferForm;
