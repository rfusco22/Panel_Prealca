"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

function EgresosTable() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/egresos");
        if (!response.ok) throw new Error("Fallo al obtener los datos");
        const result = await response.json();
        const arregloDatos = Array.isArray(result) ? result : (result.egresos || result.data || []);
        setData(arregloDatos);
      } catch {
        setError("Error al cargar el historial de egresos.");
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <Loader2 size={24} className="animate-spin text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium text-sm">Cargando historial de egresos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center bg-red-50 rounded-xl">
        <p className="text-red-600 font-medium text-sm">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
        <p className="text-slate-500 font-medium">No hay egresos registrados en el sistema.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
          <tr>
            <th className="px-6 py-4">Fecha</th>
            <th className="px-6 py-4">Proveedor</th>
            <th className="px-6 py-4">Clasificación</th>
            <th className="px-6 py-4">Subcategoría</th>
            <th className="px-6 py-4">Banco / Ref.</th>
            <th className="px-6 py-4 text-right">Monto (Bs)</th>
            <th className="px-6 py-4 text-right">Monto ($)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((egreso) => (
            <tr key={egreso.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                {new Date(egreso.fecha || egreso.createdAt).toLocaleDateString("es-VE")}
              </td>
              <td className="px-6 py-4 font-bold text-slate-800">{egreso.nombreProveedor}</td>
              <td className="px-6 py-4">
                <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-bold">
                  {egreso.clasificacionGasto}
                </span>
              </td>
              <td className="px-6 py-4 font-medium text-slate-600">{egreso.subCategoria}</td>
              <td className="px-6 py-4 text-slate-600">
                {egreso.banco}
                <div className="text-xs text-slate-400 mt-0.5">Ref: {egreso.referencia}</div>
              </td>
              <td className="px-6 py-4 text-right font-bold text-red-600">
                Bs. {Number(egreso.montoBs).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">
                $ {Number(egreso.montoDivisa).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { EgresosTable };
export default EgresosTable;
