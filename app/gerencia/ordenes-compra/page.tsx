"use client";

import { useState, useEffect } from "react";
import { formatearFecha } from '@/lib/fecha';
export default function GerenciaOrdenesCompraPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orden-compra')
      .then(res => res.json())
      .then(result => setData(result.ordenes || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Órdenes de Compra</h1>
        <p className="text-slate-500 mt-1">Órdenes de compra registradas en el sistema.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No hay órdenes de compra registradas</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nº Orden</th>
                  <th className="px-6 py-4">Proveedor</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Monto Total</th>
                  <th className="px-6 py-4">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">#{o.id}</td>
                    <td className="px-6 py-4 text-slate-600">{o.proveedorNombre || o.proveedorId}</td>
                    <td className="px-6 py-4 text-slate-600">{o.fecha ? formatearFecha(o.fecha) : '-'}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{o.montoTotal ? `Bs. ${o.montoTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}` : '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        o.estatus === 'completada' ? 'bg-green-100 text-green-800' :
                        o.estatus === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>{o.estatus || 'Pendiente'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
