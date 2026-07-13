"use client";

import { useState } from "react";
import IngresoForm from "@/components/forms/ingreso-form";
import IngresosTable from "@/components/tables/ingresos-table"; 
import { Plus, X } from "lucide-react";

export default function IngresosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cerrarModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Historial de Ingresos</h1>
          <p className="text-slate-500 mt-1">Registra y verifica los pagos de clientes y operaciones.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm px-5 py-2.5 flex items-center gap-2 transition-all font-medium"
        >
          <Plus size={18} />
          Nuevo Ingreso
        </button>
      </div>

      {/* Tabla Principal */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        <IngresosTable />
      </div>

      {/* --- MODAL MAESTRO FLUIDO (ESTILO PREMIUM) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={cerrarModal}></div>

          {/* Como el formulario de ingresos es grande, usamos max-w-4xl para que tenga espacio a lo ancho */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header del Modal */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Registro de Ingreso
                </h3>
                <p className="text-sm text-slate-500 mt-1">Registra los datos bancarios y asocia la operación al cliente.</p>
              </div>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-700 p-2 rounded-full transition-colors bg-slate-50 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            {/* Formulario */}
            <div className="flex-1 overflow-y-auto bg-white">
              <IngresoForm onClose={cerrarModal} />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}