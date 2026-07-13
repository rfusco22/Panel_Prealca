"use client";

import { useState, useEffect } from "react";

export default function IngresosTable() {
  // 1. Inicializar siempre con un arreglo vacío
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/ingresos');
        if (!response.ok) throw new Error("Fallo al obtener los datos del servidor");
        
        const result = await response.json();
        
        // 2. Extraer el arreglo dependiendo de cómo responda tu API GET
        const arregloDatos = Array.isArray(result) ? result : (result.ingresos || result.data || []);
        
        setData(arregloDatos);
      } catch (err) {
        console.error("Error cargando ingresos:", err);
        setError("Ocurrió un error al cargar el historial de ingresos.");
        setData([]); // Mantenemos el estado seguro
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 3. Manejo de estados de carga y error ANTES de renderizar la tabla
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Cargando historial de ingresos...</p>
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

  // 4. Protección contra undefined o arreglos vacíos
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
        <p className="text-gray-500">No hay ingresos registrados en el sistema.</p>
      </div>
    );
  }

  // 5. Renderizado seguro de la tabla
  return (
    <div className="overflow-x-auto rounded-md border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 font-semibold text-gray-700">ID</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Fecha</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Banco</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Referencia</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Cliente</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Monto (Bs)</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Monto ($)</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Tasa Aplicada</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((ingreso) => (
            <tr key={ingreso.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-500">#{ingreso.id}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {new Date(ingreso.createdAt || ingreso.fecha).toLocaleDateString('es-VE')}
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{ingreso.banco}</td>
              <td className="px-4 py-3 text-gray-600">{ingreso.referencia}</td>
              <td className="px-4 py-3">{ingreso.nombreCliente}</td>
              <td className="px-4 py-3 font-semibold text-green-700">Bs. {Number(ingreso.precioBs).toLocaleString('es-VE')}</td>
              <td className="px-4 py-3 text-gray-700">${Number(ingreso.precioDivisa).toLocaleString('es-VE')}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">Bs. {ingreso.tasaCambio}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}