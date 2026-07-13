"use client";

import { useState, useEffect } from "react";

export default function ClientesTable() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clientes')
      .then(res => res.json())
      .then(result => setData(result.clientes || []))
      .catch(err => {
        console.error("Error al obtener los clientes:", err);
        setData([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Cargando directorio de clientes...
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        No hay clientes registrados en el sistema.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
          <tr>
            <th className="px-6 py-4">ID</th>
            <th className="px-6 py-4">Razón Social</th>
            <th className="px-6 py-4">RIF</th>
            <th className="px-6 py-4">Teléfono</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-6 py-4 font-mono text-slate-400">#{c.id}</td>
              <td className="px-6 py-4 font-bold text-slate-800">{c.nombre}</td>
              <td className="px-6 py-4 font-medium text-slate-600">{c.rif}</td>
              <td className="px-6 py-4 text-slate-500">{c.telefono || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}