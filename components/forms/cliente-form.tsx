"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function ClienteForm({ onClose }: { onClose?: () => void }) {
  const { register, handleSubmit, reset } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setMensaje({ tipo: "", texto: "" });
    
    try {
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMensaje({ tipo: "exito", texto: "Cliente registrado exitosamente en el directorio." });
        reset();
        
        // Esperamos 1 segundo para mostrar el mensaje de éxito y luego recargamos/cerramos
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

  // Clases CSS reutilizables para mantener el diseño Premium exacto
  const inputCls = "w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-300 transition-all";
  const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
      
      <div className="p-8 space-y-6">
        
        {/* Mensajes de Alerta */}
        {mensaje.texto && (
          <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${mensaje.tipo === "error" ? "bg-red-50 text-red-700 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>
            {mensaje.tipo === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            {mensaje.texto}
          </div>
        )}

        {/* Campos del Formulario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <div className="space-y-1">
            <label className={labelCls}>Razón Social / Nombre</label>
            <input 
              type="text" 
              {...register("nombre", { required: true })} 
              className={inputCls} 
              placeholder="Ej: Inversiones CA / Juan Pérez" 
            />
          </div>

          <div className="space-y-1">
            <label className={labelCls}>RIF / Cédula</label>
            <input 
              type="text" 
              {...register("rif", { required: true })} 
              className={inputCls} 
              placeholder="Ej: J-12345678-9" 
            />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className={labelCls}>Teléfono</label>
            <input 
              type="text" 
              {...register("telefono")} 
              className={inputCls} 
              placeholder="Ej: 0414-0000000" 
            />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className={labelCls}>Dirección</label>
            <textarea 
              {...register("direccion")} 
              className={`${inputCls} resize-none`} 
              rows={3} 
              placeholder="Dirección fiscal o de residencia"
            ></textarea>
          </div>

        </div>
      </div>

      {/* FOOTER DE BOTONES */}
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