"use client";

import { useState, useEffect } from "react";
import { formatearFecha } from '@/lib/fecha';
export default function GerenciaGuiaDespachoPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/guia-despacho')
      .then(res => res.json())
      .then(result => setData(result.guias || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Guías de Despacho</h1>
        <p className="text-slate-500 mt-1">Guías de despacho registradas.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No hay guías de despacho registradas</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nº Guía</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Cantidad M³</th>
                  <th className="px-6 py-4">Chofer</th>
                  <th className="px-6 py-4">Unidad</th>
                  <th className="px-6 py-4">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((g, i) => (
                  <tr key={g.id || i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">#{g.id}</td>
                    <td className="px-6 py-4 text-slate-600">{g.productoNombre || g.productoId || '-'}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{g.cantidadM3 || g.cantidad || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{g.choferNombre || g.choferId || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{g.unidadNumero || g.unidadId || '-'}</td>
                    <td className="px-6 py-4 text-slate-500">{g.fecha ? formatearFecha(g.fecha) : '-'}</td>
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
