"use client";

import { useState, useEffect } from "react";
import RetencionesTable from "@/components/tables/retenciones-table";
import { useSocket } from '@/contexts/SocketContext';

export default function RetencionesPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      setRefreshKey((k) => k + 1);
    };

    socket.on('retenciones:created', handleUpdate);
    return () => {
      socket.off('retenciones:created', handleUpdate);
    };
  }, [socket]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Retenciones de Impuestos</h1>
          <p className="text-slate-500 mt-1">Consulta y filtra las retenciones de IVA de clientes contribuyentes especiales.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        <RetencionesTable key={refreshKey} />
      </div>
    </div>
  );
}
