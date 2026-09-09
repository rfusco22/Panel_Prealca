"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import ProveedorForm from "@/components/forms/proveedor-form";
import { Plus, X, Trash2, Pencil } from "lucide-react";

interface Proveedor {
  id: number;
  nombre: string;
  rif: string;
  direccion?: string;
  clasificacionGasto?: string;
  esContribuyenteEspecial: boolean;
  plantas?: { id: number; nombre: string }[];
  agregados?: { id: number; nombre: string }[];
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const { socket } = useSocket();

  useEffect(() => {
    fetchProveedores();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchProveedores();
    };

    socket.on("proveedores:created", handleUpdate);
    socket.on("proveedores:updated", handleUpdate);
    socket.on("proveedores:deleted", handleUpdate);

    return () => {
      socket.off("proveedores:created", handleUpdate);
      socket.off("proveedores:updated", handleUpdate);
      socket.off("proveedores:deleted", handleUpdate);
    };
  }, [socket]);

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/proveedores");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al cargar proveedores");
      setProveedores(data.proveedores);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar proveedores");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/proveedores?id=${id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar proveedor");
      }
      setProveedores(proveedores.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const abrirNuevo = () => {
    setEditingProveedor(null);
    setIsModalOpen(true);
  };

  const abrirEditar = (prov: Proveedor) => {
    setEditingProveedor(prov);
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEditingProveedor(null);
    fetchProveedores();
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Directorio de Proveedores</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Gestiona los proveedores registrados en el sistema.</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm px-5 py-2.5 flex items-center gap-2 transition-all font-medium w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          Nuevo Proveedor
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-slate-600 mx-auto"></div>
          <p className="text-slate-500 mt-3 font-medium">Cargando proveedores...</p>
        </div>
      ) : proveedores.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-slate-400 text-lg">No hay proveedores registrados</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">RIF</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plantas</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Clasificacion</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Agregados</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proveedores.map((prov) => (
                    <tr key={prov.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{prov.nombre}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">{prov.rif}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {prov.plantas && prov.plantas.length > 0 ? prov.plantas.map((pl) => (
                            <span key={pl.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                              {pl.nombre}
                            </span>
                          )) : <span className="text-slate-400 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{prov.clasificacionGasto || "—"}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {prov.agregados && prov.agregados.length > 0 ? prov.agregados.map((agg) => (
                            <span key={agg.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                              {agg.nombre}
                            </span>
                          )) : <span className="text-slate-400 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => abrirEditar(prov)}
                            className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(prov.id)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {proveedores.map((prov) => (
              <div key={prov.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{prov.nombre}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{prov.rif}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => abrirEditar(prov)}
                      className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(prov.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {prov.plantas && prov.plantas.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plantas</p>
                      <div className="flex flex-wrap gap-1">
                        {prov.plantas.map((pl) => (
                          <span key={pl.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                            {pl.nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {prov.clasificacionGasto && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clasif:</span>
                      <span className="text-xs text-slate-600">{prov.clasificacionGasto}</span>
                    </div>
                  )}

                  {prov.agregados && prov.agregados.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Agregados</p>
                      <div className="flex flex-wrap gap-1">
                        {prov.agregados.map((agg) => (
                          <span key={agg.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700">
                            {agg.nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={cerrarModal}></div>
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">{editingProveedor ? "Editar Proveedor" : "Registrar Nuevo Proveedor"}</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">{editingProveedor ? "Actualiza los datos del proveedor." : "Ingresa los datos del proveedor."}</p>
              </div>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-700 p-2 rounded-full transition-colors bg-slate-50 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              <ProveedorForm proveedor={editingProveedor} onClose={cerrarModal} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
