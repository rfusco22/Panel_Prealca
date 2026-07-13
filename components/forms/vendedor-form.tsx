"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

// Recibe la función onClose desde la página principal para cerrar el modal
export default function VendedorForm({ onClose }: { onClose?: () => void }) {
  const { register, handleSubmit, reset } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setMensaje({ tipo: "", texto: "" });
    
    try {
      const response = await fetch("/api/vendedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      if (response.ok) {
        setMensaje({ tipo: "exito", texto: "Vendedor registrado exitosamente." });
        reset();
        
        // Esperamos 1 segundo para que el usuario lea el mensaje de éxito 
        // y luego cerramos el modal y recargamos la página para actualizar la tabla
        setTimeout(() => {
          if (onClose) onClose();
          window.location.reload(); 
        }, 1000);

      } else {
        setMensaje({ tipo: "error", texto: result.error || "Error al registrar el vendedor." });
      }
    } catch (error) {
      setMensaje({ tipo: "error", texto: "Error de conexión con el servidor." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
      
      <div className="p-8 space-y-6">
        
        {mensaje.texto && (
          <div className={`p-4 rounded-xl text-sm font-medium border ${mensaje.tipo === "error" ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-700 border-green-100"}`}>
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Completo</label>
            <input 
              type="text" 
              {...register("nombre", { required: true })} 
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-300" 
              placeholder="Ej: Juan Pérez" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cédula</label>
            <input 
              type="text" 
              {...register("cedula", { required: true })} 
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-300" 
              placeholder="Ej: V-12345678" 
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono</label>
            <input 
              type="text" 
              {...register("telefono")} 
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-300" 
              placeholder="Ej: 0414-1234567" 
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dirección</label>
            <textarea 
              {...register("direccion")} 
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-300 resize-none" 
              rows={3} 
              placeholder="Dirección de residencia o fiscal"
            ></textarea>
          </div>
        </div>
      </div>

      {/* Actions Footer Interno */}
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
          {isLoading ? "Guardando..." : "Guardar vendedor"}
        </button>
      </div>

    </form>
  );
}