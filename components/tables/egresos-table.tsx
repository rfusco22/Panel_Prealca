"use client";

import { useState, useEffect } from "react";

export default function EgresosTable() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/egresos');
        if (!response.ok) throw new Error("Fallo al obtener los datos del servidor");
        
        const result = await response.json();
        
        // Extracción segura del arreglo
        const arregloDatos = Array.isArray(result) ? result : (result.egresos || result.data || []);
        
        setData(arregloDatos);
      } catch (err) {
        console.error("Error cargando egresos:", err);
        setError("Ocurrió un error al cargar el historial de egresos.");
        setData([]); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Cargando historial de egresos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-lg">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
        <p className="text-gray-500">No hay egresos registrados en el sistema.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 font-semibold text-gray-700">ID</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Fecha</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Proveedor</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Clasificación</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Banco / Ref.</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Monto (Bs)</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Monto ($)</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((egreso) => (
            <tr key={egreso.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-500">#{egreso.id}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {new Date(egreso.fecha || egreso.createdAt).toLocaleDateString('es-VE')}
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{egreso.nombreProveedor}</td>
              <td className="px-4 py-3">
                <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md text-xs font-semibold">
                  {egreso.clasificacionGasto}
                </span>
                <div className="text-xs text-gray-500 mt-1">{egreso.subCategoria}</div>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {egreso.banco} <br/>
                <span className="text-xs">{egreso.referencia}</span>
              </td>
              <td className="px-4 py-3 font-semibold text-red-700">Bs. {Number(egreso.montoBs).toLocaleString('es-VE')}</td>
              <td className="px-4 py-3 text-gray-700">${Number(egreso.montoDivisa).toLocaleString('es-VE')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}