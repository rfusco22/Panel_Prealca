"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import ChoferForm from "@/components/forms/chofer-form";
import ChoferesTable from "@/components/tables/choferes-table";
import { Plus, X } from "lucide-react";

export default function ChoferesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChofer, setEditingChofer] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      setRefreshKey((k) => k + 1);
    };

    socket.on("choferes:created", handleUpdate);
    socket.on("choferes:updated", handleUpdate);
    socket.on("choferes:deleted", handleUpdate);

    return () => {
      socket.off("choferes:created", handleUpdate);
      socket.off("choferes:updated", handleUpdate);
      socket.off("choferes:deleted", handleUpdate);
    };
  }, [socket]);

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEditingChofer(null);
    setRefreshKey((k) => k + 1);
  };

  const handleEdit = (chofer: any) => {
    setEditingChofer(chofer);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Choferes</h1>
          <p className="text-slate-500 mt-1">Gestiona el registro de choferes de la empresa.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm px-5 py-2.5 flex items-center gap-2 transition-all font-medium"
        >
          <Plus size={18} />
          Nuevo Chofer
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        <ChoferesTable key={refreshKey} onEdit={handleEdit} />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={cerrarModal}></div>
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">{editingChofer ? "Editar Chofer" : "Nuevo Chofer"}</h3>
                <p className="text-sm text-slate-500 mt-1">{editingChofer ? "Modifica los datos del chofer." : "Completa los datos del chofer."}</p>
              </div>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-700 p-2 rounded-full transition-colors bg-slate-50 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              <ChoferForm onClose={cerrarModal} initialData={editingChofer} isEditing={!!editingChofer} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
