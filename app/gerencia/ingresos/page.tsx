"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";

function formatBs(v: number) { return v.toLocaleString('es-VE', { minimumFractionDigits: 2 }) + ' Bs'; }

export default function GerenciaIngresosPage() {
  const [ingresos] = useState<any[]>([]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Historial de Ingresos</h1>
        <p className="text-slate-500 mt-1">Consulta de ingresos bancarios y operaciones.</p>
      </div>

      {ingresos.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <TrendingUp size={20} className="text-emerald-600" />
          <div>
            <p className="text-sm font-bold text-emerald-800">{ingresos.length} ingresos registrados</p>
            <p className="text-xs text-emerald-600">Total: {formatBs(ingresos.reduce((s, i) => s + (i.totalBs || 0), 0))}</p>
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
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Cliente</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Vendedor</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">M³</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Monto (Bs)</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Monto ($)</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Tipo</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No hay ingresos registrados</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
