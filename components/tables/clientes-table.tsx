"use client";

import { useState, useEffect } from "react";

function ClientesTable() {
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
            <th className="px-6 py-4">Razón Social</th>
            <th className="px-6 py-4">RIF</th>
            <th className="px-6 py-4">Teléfono</th>
            <th className="px-6 py-4">Vendedor</th>
            <th className="px-6 py-4">Dirección</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-6 py-4 font-bold text-slate-800">{c.nombre}</td>
              <td className="px-6 py-4 font-medium text-slate-600">{c.rif}</td>
              <td className="px-6 py-4 text-slate-500">{c.telefono || '-'}</td>
              <td className="px-6 py-4 text-slate-500">{c.vendedor || '-'}</td>
              <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{c.direccion || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { ClientesTable };
export default ClientesTable;