"use client";

import { useState, useEffect } from "react";
import ClienteForm from "@/components/forms/cliente-form";
import ClientesTable from "@/components/tables/clientes-table"; 
import { Plus, X } from "lucide-react";
import { useSocket } from '@/contexts/SocketContext';

export default function ClientesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { socket } = useSocket();

  const cerrarModal = () => {
    setIsModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      setRefreshKey((k) => k + 1);
    };

    socket.on('clientes:created', handleUpdate);
    return () => {
      socket.off('clientes:created', handleUpdate);
    };
  }, [socket]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header de la Página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Directorio de Clientes</h1>
          <p className="text-slate-500 mt-1">Gestiona las empresas y clientes registrados en el sistema.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm px-5 py-2.5 flex items-center gap-2 transition-all font-medium"
        >
          <Plus size={18} />
          Nuevo Cliente
        </button>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        <ClientesTable key={refreshKey} />
      </div>

      {/* --- MODAL MAESTRO FLUIDO (ESTILO PREMIUM) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Fondo oscuro con desenfoque */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={cerrarModal}></div>

          {/* Contenedor del Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header del Modal */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Registrar Nuevo Cliente
                </h3>
                <p className="text-sm text-slate-500 mt-1">Ingresa los datos fiscales y de contacto de la empresa o cliente.</p>
              </div>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-700 p-2 rounded-full transition-colors bg-slate-50 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            {/* Inyectamos el formulario pasándole la función para cerrar y recargar */}
            <div className="flex-1 overflow-y-auto bg-white">
              <ClienteForm onClose={cerrarModal} />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}