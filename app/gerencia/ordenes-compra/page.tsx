"use client";

import { useState, useEffect } from "react";
import { formatearFecha } from '@/lib/fecha';
// La página leía o.montoTotal y o.estatus, dos campos que el API no devuelve:
// el total viene como `total`, y la tabla orden_compra no tiene columna de
// estado. El total salía "-" siempre, y el estatus caía siempre en el valor
// por defecto, así que toda orden aparecía como "Pendiente" aunque el sistema
// no registra ningún estado. Ahora muestra los datos que sí existen.
function formatBs(v: unknown) {
  // total, cantidadM3 y precioM3 son DECIMAL: mysql2 los devuelve como string.
  return Number(v || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4 text-right">M³</th>
                  <th className="px-6 py-4 text-right">Monto Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">#{o.id}</td>
                    <td className="px-6 py-4 text-slate-600">{o.proveedorNombre || o.proveedorId}</td>
                    <td className="px-6 py-4 text-slate-600">{o.fecha ? formatearFecha(o.fecha) : '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{o.productoNombre || '-'}</td>
                    <td className="px-6 py-4 text-right text-slate-600 tabular-nums">{formatBs(o.cantidadM3)}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900 tabular-nums">Bs. {formatBs(o.total)}</td>
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
