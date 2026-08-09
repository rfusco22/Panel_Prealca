"use client";

import { useState, useEffect } from "react";
import { Truck, Hash } from "lucide-react";

export default function GerenciaUnidadesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/unidades')
      .then(res => res.json())
      .then(result => setData(Array.isArray(result) ? result : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Unidades de Transporte</h1>
        <p className="text-slate-500 mt-1">Flota de vehículos registrados.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No hay unidades registradas</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">N° Unidad</th>
                  <th className="px-6 py-4">Placa</th>
                  <th className="px-6 py-4">Marca / Modelo</th>
                  <th className="px-6 py-4">Año / Color</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center shrink-0"><Hash size={16} /></div>
                        {u.numeroUnidad}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm tracking-wide text-blue-600 font-semibold">
                      <span className="bg-blue-50/50 px-2 py-1 rounded border border-blue-100">{u.placa}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{u.marca}</span>
                        <span className="text-xs text-slate-500">{u.modelo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">{u.ano}</span>
                        <span className="text-xs text-slate-500 capitalize">{u.color}</span>
                      </div>
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
