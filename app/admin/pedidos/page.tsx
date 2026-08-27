"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { Plus, X, Trash2, Clock, CheckCircle2, XCircle, Loader2, ShoppingCart, AlertCircle } from "lucide-react";
import { formatearFecha } from '@/lib/fecha';
interface Pedido {
  id: number;
  clienteId: number;
  clienteNombre: string;
  productoId: number;
  productoNombre: string;
  cantidadM3: number;
  estado: string;
  notas: string | null;
  obra: string | null;
  usuarioNombre: string;
  fecha: string;
}

interface Cliente { id: number; nombre: string }
interface Producto { id: number; resistencia?: string; pulgada?: string }

const estadoBadge: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  pendiente: { bg: "bg-amber-50", text: "text-amber-700", icon: Clock, label: "Pendiente" },
  en_proceso: { bg: "bg-blue-50", text: "text-blue-700", icon: Loader2, label: "En Proceso" },
  completado: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2, label: "Completado" },
  cancelado: { bg: "bg-red-50", text: "text-red-700", icon: XCircle, label: "Cancelado" },
};

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formCliente, setFormCliente] = useState("");
  const [formProducto, setFormProducto] = useState("");
  const [formCantidad, setFormCantidad] = useState("");
  const [formNotas, setFormNotas] = useState("");
  const [formObra, setFormObra] = useState("");

  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      const [pRes, cRes, prRes] = await Promise.all([
        fetch("/api/pedidos"),
        fetch("/api/clientes"),
        fetch("/api/productos"),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      const prData = await prRes.json();
      setPedidos(pData.success ? pData.pedidos : []);
      setClientes(cData.success ? cData.clientes : []);
      setProductos(Array.isArray(prData) ? prData : prData.productos || []);
    } catch {
      console.error("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchData();
    socket.on("pedidos:created", handleUpdate);
    socket.on("pedidos:updated", handleUpdate);
    socket.on("pedidos:deleted", handleUpdate);
    return () => {
      socket.off("pedidos:created", handleUpdate);
      socket.off("pedidos:updated", handleUpdate);
      socket.off("pedidos:deleted", handleUpdate);
    };
  }, [socket]);

  const openModal = () => {
    setFormCliente("");
    setFormProducto("");
    setFormCantidad("");
    setFormNotas("");
    setFormObra("");
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formCliente || !formProducto || !formCantidad) {
      setError("Todos los campos son requeridos");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: Number(formCliente),
          productoId: Number(formProducto),
          cantidadM3: Number(formCantidad),
          notas: formNotas || undefined,
          obra: formObra || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Error al crear");
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear pedido");
    } finally {
      setSubmitting(false);
    }
  };

  const cambiarEstado = async (id: number, estado: string) => {
    try {
      await fetch("/api/pedidos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estado }),
      });
    } catch (err) {
      console.error("Error updating estado", err);
    }
  };

  const eliminarPedido = async (id: number) => {
    if (!confirm("¿Eliminar este pedido?")) return;
    try {
      await fetch(`/api/pedidos?id=${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Error deleting pedido", err);
    }
  };

  const inputCls = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-400 bg-white transition-all";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5";

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pedidos</h1>
          <p className="text-slate-500 mt-1">Gestiona los pedidos de clientes.</p>
        </div>
        <button onClick={openModal} className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm px-5 py-2.5 flex items-center gap-2 transition-all font-medium">
          <Plus size={18} />
          Nuevo Pedido
        </button>
      </div>

      {/* Listado: Cards en móvil, Tabla en desktop */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" size={32} /><p className="mt-3 text-slate-500">Cargando pedidos...</p></div>
        ) : pedidos.length === 0 ? (
          <div className="p-12 text-center"><ShoppingCart className="mx-auto text-slate-300 mb-3" size={48} /><p className="text-slate-500 font-medium">No hay pedidos registrados</p></div>
        ) : (
          <>
            {/* MOBILE: Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {pedidos.map((pedido) => {
                const badge = estadoBadge[pedido.estado] || estadoBadge.pendiente;
                const Icon = badge.icon;
                return (
                  <div key={pedido.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">#{pedido.id}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.bg} ${badge.text}`}>
                          <Icon size={11} className={pedido.estado === "en_proceso" ? "animate-spin" : ""} />
                          {badge.label}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900">{Number(pedido.cantidadM3).toFixed(2)} M³</span>
                    </div>
                    <div className="text-sm font-medium text-slate-900 mb-1">{pedido.clienteNombre}</div>
                    <div className="text-xs text-slate-500 mb-2">{pedido.productoNombre}</div>
                    {pedido.obra && (
                      <div className="text-xs text-slate-600 mb-2"><span className="font-semibold">Obra:</span> {pedido.obra}</div>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                      <span>{pedido.usuarioNombre}</span>
                      <span>{formatearFecha(pedido.fecha)}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {pedido.estado === "pendiente" && (
                        <button onClick={() => cambiarEstado(pedido.id, "en_proceso")} className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors">Procesar</button>
                      )}
                      {pedido.estado === "en_proceso" && (
                        <button onClick={() => cambiarEstado(pedido.id, "completado")} className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-medium transition-colors">Completar</button>
                      )}
                      {pedido.estado !== "cancelado" && pedido.estado !== "completado" && (
                        <button onClick={() => cambiarEstado(pedido.id, "cancelado")} className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition-colors">Cancelar</button>
                      )}
                      <button onClick={() => eliminarPedido(pedido.id)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors ml-auto">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP: Tabla */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Cliente</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Producto</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Obra</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Cant. M³</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Estado</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Por</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Fecha</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((pedido) => {
                    const badge = estadoBadge[pedido.estado] || estadoBadge.pendiente;
                    const Icon = badge.icon;
                    return (
                      <tr key={pedido.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900">{pedido.id}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{pedido.clienteNombre}</td>
                        <td className="px-4 py-3 text-slate-600">{pedido.productoNombre}</td>
                        <td className="px-4 py-3 text-slate-600">{pedido.obra || "—"}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{Number(pedido.cantidadM3).toFixed(2)} M³</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                            <Icon size={12} className={pedido.estado === "en_proceso" ? "animate-spin" : ""} />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{pedido.usuarioNombre}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{formatearFecha(pedido.fecha)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {pedido.estado === "pendiente" && (
                              <button onClick={() => cambiarEstado(pedido.id, "en_proceso")} className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-lg font-medium transition-colors">Procesar</button>
                            )}
                            {pedido.estado === "en_proceso" && (
                              <button onClick={() => cambiarEstado(pedido.id, "completado")} className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-1 rounded-lg font-medium transition-colors">Completar</button>
                            )}
                            {pedido.estado !== "cancelado" && pedido.estado !== "completado" && (
                              <button onClick={() => cambiarEstado(pedido.id, "cancelado")} className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1 rounded-lg font-medium transition-colors">Cancelar</button>
                            )}
                            <button onClick={() => eliminarPedido(pedido.id)} className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal Nuevo Pedido */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Nuevo Pedido</h3>
                <p className="text-sm text-slate-500 mt-1">Selecciona cliente, producto y cantidad.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-2 rounded-full transition-colors bg-slate-50 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-5">
              {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-800 p-4 rounded-xl">
                  <AlertCircle size={20} className="text-red-500 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div>
                <label className={labelCls}>Cliente</label>
                <select value={formCliente} onChange={(e) => setFormCliente(e.target.value)} className={inputCls}>
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Producto</label>
                <select value={formProducto} onChange={(e) => setFormProducto(e.target.value)} className={inputCls}>
                  <option value="">Seleccionar producto...</option>
                  {productos.map((p) => <option key={p.id} value={p.id}>{p.resistencia} - {p.pulgada}"</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Obra</label>
                <input type="text" value={formObra} onChange={(e) => setFormObra(e.target.value)} placeholder="Nombre de la obra..." className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Cantidad (M³)</label>
                <input type="number" step="0.01" min="0.01" value={formCantidad} onChange={(e) => setFormCantidad(e.target.value)} placeholder="0.00" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Notas (opcional)</label>
                <textarea value={formNotas} onChange={(e) => setFormNotas(e.target.value)} placeholder="Notas adicionales..." rows={3} className={`${inputCls} resize-none`} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-200">Cancelar</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-700 active:scale-[0.98] text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                  {submitting && <Loader2 size={15} className="animate-spin" />}
                  {submitting ? "Guardando..." : "Crear Pedido"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
