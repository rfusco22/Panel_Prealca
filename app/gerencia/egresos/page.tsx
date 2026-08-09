"use client";

import { useState } from "react";
import { TrendingDown } from "lucide-react";

function formatBs(v: number) { return v.toLocaleString('es-VE', { minimumFractionDigits: 2 }) + ' Bs'; }

export default function GerenciaEgresosPage() {
  const [egresos] = useState<any[]>([]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Historial de Egresos</h1>
        <p className="text-slate-500 mt-1">Consulta de egresos y pagos a proveedores.</p>
      </div>

      {egresos.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <TrendingDown size={20} className="text-red-600" />
          <div>
            <p className="text-sm font-bold text-red-800">{egresos.length} egresos registrados</p>
            <p className="text-xs text-red-600">Total: {formatBs(egresos.reduce((s, e) => s + (e.montoBs || 0), 0))}</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Banco</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Proveedor</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Clasificación</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Monto (Bs)</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Monto ($)</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No hay egresos registrados</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
