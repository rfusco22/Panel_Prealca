'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { OrdenesCompraTable } from '@/components/tables/ordenes-compra-table';

export default function OrdenesCompraPage() {
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const { socket } = useSocket();

  const fetchOrdenes = async () => {
    try {
      const res = await fetch('/api/orden-compra');
      const data = await res.json();
      if (data.success) setOrdenes(data.ordenes);
    } catch (err) {
      console.error('[v0] Error fetching órdenes de compra:', err);
    }
  };

  useEffect(() => {
    fetchOrdenes();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchOrdenes();
    };

    socket.on("orden-compra:created", handleUpdate);
    socket.on("orden-compra:updated", handleUpdate);
    socket.on("orden-compra:deleted", handleUpdate);

    return () => {
      socket.off("orden-compra:created", handleUpdate);
      socket.off("orden-compra:updated", handleUpdate);
      socket.off("orden-compra:deleted", handleUpdate);
    };
  }, [socket]);

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/orden-compra?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setOrdenes((prev) => prev.filter((o) => o.id !== id));
    } else {
      alert('Error al eliminar orden de compra');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Órdenes de Compra</h1>
        <Link href="/registro/ordenes-compra/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            <Plus size={20} />
            Nueva Orden
          </Button>
        </Link>
      </div>

      <OrdenesCompraTable
        data={ordenes}
        onDelete={handleDelete}
      />
    </div>
  );
}
