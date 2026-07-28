"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, CheckCircle2 } from "lucide-react";

function ClienteForm({ onClose }: { onClose?: () => void }) {
  const { register, handleSubmit, reset, watch } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [vendedores, setVendedores] = useState<any[]>([]);

  const numeroRif = watch("numeroRif");
  const rifValido = numeroRif && /^\d{7,10}(-\d)?$/.test(numeroRif);
  const rifError = numeroRif && numeroRif.length > 0 && !rifValido;

  const numeroTelefono = watch("numeroTelefono");
  const telefonoValido = numeroTelefono && /^\d{7}$/.test(numeroTelefono);
  const telefonoError = numeroTelefono && numeroTelefono.length > 0 && !telefonoValido;

  useEffect(() => {
    fetch("/api/vendedores")
      .then((res) => res.json())
      .then((result) => setVendedores(result.vendedores || []))
      .catch(() => setVendedores([]));
  }, []);

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setMensaje({ tipo: "", texto: "" });
    try {
      const telefono = data.prefijoTelefono && data.numeroTelefono ? `${data.prefijoTelefono}-${data.numeroTelefono}` : data.numeroTelefono || null;
      const rif = data.prefijoRif && data.numeroRif ? `${data.prefijoRif}-${data.numeroRif}` : data.numeroRif || '';
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, telefono, rif }),
      });
      const result = await response.json();
      if (response.ok) {
        setMensaje({ tipo: "exito", texto: "Cliente registrado exitosamente en el directorio." });
        reset();
        setTimeout(() => {
          if (onClose) onClose();
          window.location.reload();
        }, 1200);
      } else {
        setMensaje({ tipo: "error", texto: result.error || "Error al registrar el cliente." });
      }
    } catch (error) {
      setMensaje({ tipo: "error", texto: "Error de conexión con el servidor." });
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-300 transition-all";
  const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
      <div className="p-8 space-y-6">
        {mensaje.texto && (
          <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${mensaje.tipo === "error" ? "bg-red-50 text-red-700 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>
            {mensaje.tipo === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            {mensaje.texto}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className={labelCls}>Razón Social / Nombre</label>
            <input
              type="text"
              {...register("nombre", { required: "El nombre es requerido" })}
              className={inputCls}
              placeholder="Ej: Inversiones CA / Juan Pérez"
            />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>RIF / Cédula</label>
            <div className="flex gap-2">
              <select
                {...register("prefijoRif")}
                className="w-[70px] px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 shadow-sm transition-all"
              >
                <option value="V">V</option>
                <option value="J">J</option>
                <option value="G">G</option>
                <option value="E">E</option>
                <option value="P">P</option>
              </select>
              <input
                type="text"
                {...register("numeroRif", {
                  required: "El número es requerido",
                  pattern: { value: /^\d{7,10}(-\d)?$/, message: "Formato: 12345678 o 12345678-9" },
                })}
                className={`${inputCls} ${rifValido ? '!border-green-500 !ring-green-100' : rifError ? '!border-red-400 !ring-red-100' : ''}`}
                placeholder="12345678"
                onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9\-]/g, ''); }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Teléfono</label>
            <div className="flex gap-2">
              <select
                {...register("prefijoTelefono")}
                className="w-[140px] px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 shadow-sm transition-all"
              >
                <option value="0412">0412</option>
                <option value="0422">0422</option>
                <option value="0414">0414</option>
                <option value="0424">0424</option>
                <option value="0416">0416</option>
                <option value="0426">0426</option>
              </select>
              <input
                type="text"
                {...register("numeroTelefono", {
                  required: "El número es requerido",
                  pattern: { value: /^\d{7}$/, message: "Solo 7 dígitos numéricos" },
                })}
                className={`${inputCls} ${telefonoValido ? '!border-green-500 !ring-green-100' : telefonoError ? '!border-red-400 !ring-red-100' : ''}`}
                placeholder="0000000"
                maxLength={7}
                onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 7); }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Vendedor</label>
            <select
              {...register("vendedor", { required: "El vendedor es requerido" })}
              className={inputCls}
            >
              <option value="">Seleccionar vendedor</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.nombre}>{v.nombre}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className={labelCls}>Dirección</label>
            <textarea
              {...register("direccion", { required: "La dirección es requerida" })}
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Dirección fiscal o de residencia"
            ></textarea>
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="esContribuyenteEspecial"
              {...register("esContribuyenteEspecial")}
              className="w-5 h-5 rounded border-slate-300 text-slate-800 focus:ring-slate-800"
            />
            <label htmlFor="esContribuyenteEspecial" className="text-sm font-medium text-slate-700">
              Contribuyente Especial
            </label>
          </div>
        </div>
      </div>
      <div className="px-8 py-6 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100 mt-auto">
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-700 hover:bg-slate-200 bg-slate-100 border border-slate-200 rounded-xl px-6 py-4 text-sm font-medium transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-8 py-4 shadow-md transition-all text-sm font-semibold disabled:opacity-50"
        >
          {isLoading ? "Guardando..." : "Guardar Cliente"}
        </button>
      </div>
    </form>
  );
}

export { ClienteForm };
export default ClienteForm;
