"use client";

import { useState, useEffect } from "react";

export default function GerenciaProveedoresPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/proveedores')
      .then(res => res.json())
      .then(result => setData(result.proveedores || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Proveedores</h1>
        <p className="text-slate-500 mt-1">Directorio de proveedores del sistema.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No hay proveedores registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">RIF</th>
                  <th className="px-6 py-4">Dirección</th>
                  <th className="px-6 py-4">Clasificación</th>
                  <th className="px-6 py-4">Contribuyente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{p.nombre}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{p.rif}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{p.direccion || '-'}</td>
                    <td className="px-6 py-4 text-slate-500">{p.clasificacionGasto || '-'}</td>
                    <td className="px-6 py-4">
                      {p.esContribuyenteEspecial ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Sí</span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">No</span>
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
