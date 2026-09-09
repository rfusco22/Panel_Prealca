'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { FacturasTable } from '@/components/tables/facturas-table';

export default function FacturasPage() {
  const [facturas, setFacturas] = useState<any[]>([]);
  const { socket } = useSocket();

  const fetchFacturas = async () => {
    try {
      const res = await fetch('/api/facturas');
      const data = await res.json();
      if (data.success) setFacturas(data.facturas);
    } catch (err) {
      console.error('[v0] Error fetching facturas:', err);
    }
  };

  useEffect(() => {
    fetchFacturas();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchFacturas();
    };

    socket.on("facturas:created", handleUpdate);
    socket.on("facturas:updated", handleUpdate);
    socket.on("facturas:deleted", handleUpdate);

    return () => {
      socket.off("facturas:created", handleUpdate);
      socket.off("facturas:updated", handleUpdate);
      socket.off("facturas:deleted", handleUpdate);
    };
  }, [socket]);

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/facturas?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Error al eliminar factura');
    setFacturas((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Facturas</h1>
        <Link href="/registro/facturas/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            <Plus size={20} />
            Nueva Factura
          </Button>
        </Link>
      </div>

      <FacturasTable
        data={facturas}
        onDelete={handleDelete}
        editLink={(id) => `/registro/facturas/${id}/edit`}
      />
    </div>
  );
}
