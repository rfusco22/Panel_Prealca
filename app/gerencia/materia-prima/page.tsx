"use client";

import { useState, useEffect } from "react";
import { formatearFecha } from '@/lib/fecha';
export default function GerenciaMateriaPrimaPage() {
  const [agregados, setAgregados] = useState<any[]>([]);
  const [materiaPrima, setMateriaPrima] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/agregados").then(r => r.json()),
      fetch("/api/materia-prima").then(r => r.json())
    ]).then(([aggData, mpData]) => {
      setAgregados(Array.isArray(aggData) ? aggData : []);
      setMateriaPrima(Array.isArray(mpData) ? mpData : (mpData.materiaPrima || []));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getUnidad = (id: number) => {
    const agg = agregados.find((a: any) => a.id === id);
    return agg ? (agg.unidadMedida || agg.unidad_medida || '') : '';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Materia Prima</h1>
        <p className="text-slate-500 mt-1">Entradas de materia prima registradas.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : materiaPrima.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No hay entradas de materia prima</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Material</th>
                  <th className="px-6 py-4">Cantidad</th>
                  <th className="px-6 py-4">Unidad</th>
                  <th className="px-6 py-4">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materiaPrima.map((mp: any, i: number) => (
                  <tr key={mp.id || i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{mp.agregadoNombre || mp.nombre || '-'}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{mp.cantidad}</td>
                    <td className="px-6 py-4 text-slate-500">{getUnidad(mp.agregado_id || mp.agregadoId) || mp.unidadMedida || '-'}</td>
                    <td className="px-6 py-4 text-slate-500">{mp.fecha ? formatearFecha(mp.fecha) : '-'}</td>
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
