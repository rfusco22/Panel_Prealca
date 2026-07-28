"use client";

import RetencionesTable from "@/components/tables/retenciones-table";

export default function RetencionesPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Retenciones de Impuestos</h1>
          <p className="text-slate-500 mt-1">Consulta y filtra las retenciones de IVA de clientes contribuyentes especiales.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        <RetencionesTable />
      </div>
    </div>
  );
}
