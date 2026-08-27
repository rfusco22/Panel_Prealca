"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { formatearFecha } from '@/lib/fecha';
const estadoBadge: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  pendiente: { bg: "bg-amber-50", text: "text-amber-700", icon: Clock, label: "Pendiente" },
  en_proceso: { bg: "bg-blue-50", text: "text-blue-700", icon: Loader2, label: "En Proceso" },
  completado: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2, label: "Completado" },
  cancelado: { bg: "bg-red-50", text: "text-red-700", icon: XCircle, label: "Cancelado" },
};

export default function GerenciaPedidosPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pedidos')
      .then(res => res.json())
      .then(result => setData(result.pedidos || result.data || (Array.isArray(result) ? result : [])))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pedidos</h1>
        <p className="text-slate-500 mt-1">Pedidos realizados en el sistema.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No hay pedidos registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nº Pedido</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Cantidad M³</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((p) => {
                  const badge = estadoBadge[p.estado] || estadoBadge.pendiente;
                  const Icon = badge.icon;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">#{p.id}</td>
                      <td className="px-6 py-4 text-slate-600">{p.clienteNombre || '-'}</td>
                      <td className="px-6 py-4 text-slate-600">{p.productoNombre || '-'}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{p.cantidadM3}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                          <Icon size={12} /> {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{p.fecha ? formatearFecha(p.fecha) : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
