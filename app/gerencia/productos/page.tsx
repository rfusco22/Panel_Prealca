"use client";

import { useState, useEffect } from "react";
import { Layers, ShieldAlert } from "lucide-react";

export default function GerenciaProductosPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/productos')
      .then(res => res.json())
      .then(result => setData(Array.isArray(result) ? result : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Productos</h1>
        <p className="text-slate-500 mt-1">Catálogo de productos y fórmulas.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No hay productos registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Resistencia</th>
                  <th className="px-6 py-4">Pulgada</th>
                  <th className="px-6 py-4">Unidad</th>
                  <th className="px-6 py-4">Composición de Fórmula</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-slate-50 text-blue-600 rounded-xl border border-blue-100/50 flex items-center justify-center shrink-0">
                          <Layers size={18} />
                        </div>
                        <span className="font-bold text-slate-900">{p.resistencia}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100/80 border border-slate-200/50 text-xs font-semibold text-slate-700">{p.pulgada} "</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-slate-50 text-slate-500 font-mono text-xs font-medium border border-slate-100">{p.unidad}</span>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      {p.formula && p.formula.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {p.formula.map((f: any, idx: number) => (
                            <div key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-xs">
                              <span className="font-semibold text-slate-700">{f.nombre}</span>
                              <div className="w-px h-3 bg-slate-200"></div>
                              <span className="font-mono font-bold text-blue-600">{Number(f.cantidad)}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">{f.unidadMedida?.split(' ')[0]}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-100/50 text-xs text-orange-600 font-medium">
                          <ShieldAlert size={14} /> Sin fórmula
                        </span>
                      )}
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
