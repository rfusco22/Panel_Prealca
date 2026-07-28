"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, CheckCircle2 } from "lucide-react";

function ProveedorForm({ onClose }: { onClose?: () => void }) {
  const { register, handleSubmit, reset } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setMensaje({ tipo: "", texto: "" });
    try {
      const response = await fetch("/api/proveedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setMensaje({ tipo: "exito", texto: "Proveedor registrado exitosamente" });
        reset();
        setTimeout(() => {
          if (onClose) onClose();
        }, 1200);
      } else {
        setMensaje({ tipo: "error", texto: result.error || "Error al registrar proveedor" });
      }
    } catch (error) {
      setMensaje({ tipo: "error", texto: "Error de conexion con el servidor" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
      {mensaje.tipo === "exito" && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl">
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          <p className="text-sm font-medium">{mensaje.texto}</p>
        </div>
      )}
      {mensaje.tipo === "error" && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl">
          <AlertCircle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm font-medium">{mensaje.texto}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nombre *</label>
          <input
            {...register("nombre", { required: "El nombre es requerido", minLength: { value: 3, message: "Minimo 3 caracteres" } })}
            type="text"
            placeholder="Nombre del proveedor"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">RIF *</label>
          <input
            {...register("rif", { required: "El RIF es requerido", minLength: { value: 6, message: "Minimo 6 caracteres" } })}
            type="text"
            placeholder="J-12345678"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Direccion</label>
        <textarea
          {...register("direccion")}
          placeholder="Direccion del proveedor"
          rows={2}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Clasificacion de Gasto</label>
          <select
            {...register("clasificacionGasto")}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          >
            <option value="">Seleccionar...</option>
            <option value="Mantenimiento">Mantenimiento</option>
            <option value="Produccion">Produccion</option>
            <option value="Administracion">Administracion</option>
            <option value="Venta">Venta</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div className="flex items-center gap-3 pt-6">
          <input {...register("esContribuyenteEspecial")} type="checkbox" id="contribuyente" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
          <label htmlFor="contribuyente" className="text-sm font-medium text-slate-700 cursor-pointer">Contribuyente Especial</label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        {onClose && (
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-200">
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-700 active:scale-[0.98] text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? "Guardando..." : "Guardar Proveedor"}
        </button>
      </div>
    </form>
  );
}

export default ProveedorForm;
