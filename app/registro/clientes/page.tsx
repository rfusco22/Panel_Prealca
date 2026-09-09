"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import ClienteForm from "@/components/forms/cliente-form";
import ClientesTable from "@/components/tables/clientes-table";
import { Plus, X } from "lucide-react";

interface Cliente {
  id: number;
  nombre: string;
  rif: string;
  telefono?: string;
  vendedor?: string;
  direccion?: string;
  esContribuyenteEspecial?: boolean;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const { socket } = useSocket();

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/clientes");
      const result = await response.json();
      setClientes(result.clientes || []);
    } catch (err) {
      console.error("Error al obtener los clientes:", err);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchClientes();
    };

    socket.on("clientes:created", handleUpdate);
    socket.on("clientes:updated", handleUpdate);
    socket.on("clientes:deleted", handleUpdate);

    return () => {
      socket.off("clientes:created", handleUpdate);
      socket.off("clientes:updated", handleUpdate);
      socket.off("clientes:deleted", handleUpdate);
    };
  }, [socket]);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este cliente del directorio?")) return;
    try {
      const response = await fetch(`/api/clientes?id=${id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar cliente");
      }
      setClientes((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const abrirNuevo = () => {
    setEditingCliente(null);
    setIsModalOpen(true);
  };

  const abrirEditar = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEditingCliente(null);
    fetchClientes();
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Directorio de Clientes</h1>
          <p className="text-slate-500 mt-1">Gestiona las empresas y clientes registrados en el sistema.</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm px-5 py-2.5 flex items-center gap-2 transition-all font-medium"
        >
          <Plus size={18} />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        <ClientesTable data={clientes} isLoading={loading} onEdit={abrirEditar} onDelete={handleDelete} />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={cerrarModal}></div>
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">{editingCliente ? "Editar Cliente" : "Registrar Nuevo Cliente"}</h3>
                <p className="text-sm text-slate-500 mt-1">{editingCliente ? "Actualiza los datos fiscales y de contacto." : "Ingresa los datos fiscales y de contacto de la empresa o cliente."}</p>
              </div>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-700 p-2 rounded-full transition-colors bg-slate-50 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              <ClienteForm cliente={editingCliente} onClose={cerrarModal} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
