"use client";

import { useState, useEffect } from "react";
import { Eye } from "lucide-react";

export default function GerenciaClientesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clientes')
      .then(res => res.json())
      .then(result => setData(result.clientes || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Clientes</h1>
        <p className="text-slate-500 mt-1">Directorio de clientes del sistema.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No hay clientes registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Razón Social</th>
                  <th className="px-6 py-4">RIF</th>
                  <th className="px-6 py-4">Teléfono</th>
                  <th className="px-6 py-4">Vendedor</th>
                  <th className="px-6 py-4">Dirección</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{c.nombre}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{c.rif}</td>
                    <td className="px-6 py-4 text-slate-500">{c.telefono || '-'}</td>
                    <td className="px-6 py-4 text-slate-500">{c.vendedor || '-'}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{c.direccion || '-'}</td>
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
