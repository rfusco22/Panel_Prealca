"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import VendedorForm from "@/components/forms/vendedor-form";
import VendedoresTable from "@/components/tables/vendedores-table";
import { Plus, X } from "lucide-react";

interface Vendedor {
  id: number;
  nombre: string;
  cedula: string;
  telefono?: string;
  direccion?: string;
  createdAt?: string;
}

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<Vendedor | null>(null);
  const { socket } = useSocket();

  const fetchVendedores = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/vendedores");
      if (!response.ok) throw new Error("Fallo al obtener los datos del servidor");
      const result = await response.json();
      setVendedores(Array.isArray(result) ? result : (result.vendedores || result.data || []));
    } catch (err) {
      console.error("Error cargando vendedores:", err);
      setError("Ocurrió un error al cargar el directorio de vendedores.");
      setVendedores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendedores();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchVendedores();
    };

    socket.on("vendedores:created", handleUpdate);
    socket.on("vendedores:updated", handleUpdate);
    socket.on("vendedores:deleted", handleUpdate);

    return () => {
      socket.off("vendedores:created", handleUpdate);
      socket.off("vendedores:updated", handleUpdate);
      socket.off("vendedores:deleted", handleUpdate);
    };
  }, [socket]);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este vendedor del directorio?")) return;
    try {
      const response = await fetch(`/api/vendedores?id=${id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar vendedor");
      }
      setVendedores((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const abrirNuevo = () => {
    setEditingVendedor(null);
    setIsModalOpen(true);
  };

  const abrirEditar = (vendedor: Vendedor) => {
    setEditingVendedor(vendedor);
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEditingVendedor(null);
    fetchVendedores();
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Directorio de Vendedores</h1>
          <p className="text-slate-500 mt-1">Gestiona el equipo de ventas y su información de contacto.</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm px-5 py-2.5 flex items-center gap-2 transition-all font-medium"
        >
          <Plus size={18} />
          Nuevo Vendedor
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        <VendedoresTable data={vendedores} isLoading={loading} error={error} onEdit={abrirEditar} onDelete={handleDelete} />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={cerrarModal}></div>
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">{editingVendedor ? "Editar vendedor" : "Añadir nuevo vendedor"}</h3>
                <p className="text-sm text-slate-500 mt-1">{editingVendedor ? "Actualiza los datos personales y de contacto." : "Ingresa los datos personales y de contacto del vendedor."}</p>
              </div>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-700 p-2 rounded-full transition-colors bg-slate-50 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <VendedorForm vendedor={editingVendedor} onClose={cerrarModal} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
