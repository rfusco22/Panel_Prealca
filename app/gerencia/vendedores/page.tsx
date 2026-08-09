"use client";

import { useState, useEffect } from "react";

export default function GerenciaVendedoresPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vendedores')
      .then(res => res.json())
      .then(result => setData(Array.isArray(result) ? result : (result.vendedores || result.data || [])))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Vendedores</h1>
        <p className="text-slate-500 mt-1">Directorio de vendedores del sistema.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No hay vendedores registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Cédula</th>
                  <th className="px-6 py-4">Teléfono</th>
                  <th className="px-6 py-4">Dirección</th>
                  <th className="px-6 py-4">Fecha Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-slate-500">#{v.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{v.nombre}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{v.cedula}</td>
                    <td className="px-6 py-4 text-slate-500">{v.telefono || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{v.direccion || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(v.createdAt).toLocaleDateString('es-VE')}</td>
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
