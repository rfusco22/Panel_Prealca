"use client";

import { TrendingUp } from "lucide-react";
import { IngresosTable } from "@/components/tables/ingresos-table";

// Antes esta página era una maqueta: declaraba useState([]) y nunca pedía
// datos, así que Gerencia veía "No hay ingresos registrados" siempre, hubiera
// ingresos o no. Mientras la tabla ingresos estuvo vacía no se notaba, porque
// la maqueta mostraba lo mismo que habría mostrado la página real.
//
// Ahora monta IngresosTable, que ya existía completa (carga, error, estado
// vacío) pero nadie usaba. Es de solo lectura a propósito: los ingresos se
// registran desde Admin, y Gerencia los consulta.
export default function GerenciaIngresosPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-emerald-50 rounded-xl"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Historial de Ingresos</h1>
          <p className="text-slate-500 mt-1">Consulta de ingresos bancarios y operaciones.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-4">
        <IngresosTable />
      </div>
    </div>
  );
}
