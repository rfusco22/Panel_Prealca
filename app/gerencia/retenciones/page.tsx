"use client";

import { useState, useEffect } from "react";

export default function GerenciaRetencionesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/retenciones')
      .then(res => res.json())
      .then(result => {
        const arr = Array.isArray(result) ? result : (result.retenciones || result.data || []);
        setData(arr);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Retenciones</h1>
        <p className="text-slate-500 mt-1">Retenciones de IVA de clientes contribuyentes especiales.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No hay retenciones registradas</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Factura</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">RIF</th>
                  <th className="px-6 py-4">Total Factura</th>
                  <th className="px-6 py-4">IVA (16%)</th>
                  <th className="px-6 py-4">Retención</th>
                  <th className="px-6 py-4 text-right">Monto Retenido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                      {new Date(ret.fecha || ret.created_at).toLocaleDateString("es-VE")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-bold">#{ret.factura_id}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{ret.cliente_nombre}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">{ret.cliente_rif}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      Bs. {Number(ret.factura_total).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-blue-600">
                      Bs. {Number(ret.iva_monto).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-orange-600">
                      {ret.porcentaje_retencion}%
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">
                      Bs. {Number(ret.monto_retenido).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
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
