"use client";

import { TrendingDown } from "lucide-react";
import { EgresosTable } from "@/components/tables/egresos-table";

// Antes esta página era una maqueta: declaraba useState([]) y nunca pedía
// datos, así que Gerencia veía "No hay egresos registrados" siempre.
//
// Ahora monta EgresosTable, que ya existía completa pero nadie usaba. Es de
// solo lectura: los egresos se registran desde Admin -incluidos los pagos de
// materia prima, clasificación Producción, de donde sale el gasto del reporte
// de materia prima- y Gerencia los consulta.
export default function GerenciaEgresosPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-red-50 rounded-xl"><TrendingDown className="w-5 h-5 text-red-600" /></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Historial de Egresos</h1>
          <p className="text-slate-500 mt-1">Consulta de egresos y pagos a proveedores.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <EgresosTable />
      </div>
    </div>
  );
}
