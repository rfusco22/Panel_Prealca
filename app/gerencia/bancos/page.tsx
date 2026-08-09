"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function GerenciaBancosPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bancos')
      .then(res => res.json())
      .then(result => setData(Array.isArray(result) ? result : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cuentas Bancarias</h1>
        <p className="text-slate-500 mt-1">Cuentas bancarias registradas en el sistema.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No hay cuentas bancarias registradas</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Banco</th>
                  <th className="px-6 py-4">Número de Cuenta</th>
                  <th className="px-6 py-4">Titular</th>
                  <th className="px-6 py-4">Documento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((b) => {
                  const prefix = b.numeroCuenta?.substring(0, 4);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center shrink-0 overflow-hidden p-1">
                          <Image src={`/bancos/${prefix}.png`} alt={b.nombreBanco} width={28} height={28} className="object-contain w-full h-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                        {b.nombreBanco}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-600 tracking-wide">{b.numeroCuenta}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{b.titularCuenta}</td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-500">{b.cedula}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
