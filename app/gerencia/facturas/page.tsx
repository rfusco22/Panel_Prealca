"use client";

import { useState, useEffect } from "react";

export default function GerenciaFacturasPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/facturas')
      .then(res => res.json())
      .then(result => setData(result.facturas || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Facturas</h1>
        <p className="text-slate-500 mt-1">Facturas emitidas en el sistema.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No hay facturas registradas</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nº Factura</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Monto</th>
                  <th className="px-6 py-4">IVA</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{f.numeroFactura}</td>
                    <td className="px-6 py-4 text-slate-600">{f.tipoFactura}</td>
                    <td className="px-6 py-4 text-slate-600">Cliente #{f.clienteId}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">Bs. {f.montoTotal?.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-slate-600">{f.iva ? `Bs. ${f.iva.toLocaleString('es-ES', { minimumFractionDigits: 2 })}` : 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(f.fechaEmision).toLocaleDateString('es-ES')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        f.estatus === 'Pagada' ? 'bg-green-100 text-green-800' :
                        f.estatus === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{f.estatus}</span>
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
