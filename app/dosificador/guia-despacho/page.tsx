'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { GuiaDespachoTable } from '@/components/tables/guia-despacho-table';
import { useSocket } from '@/contexts/SocketContext';

export default function GuiaDespachoPage() {
  const { socket } = useSocket();
  const [guias, setGuias] = useState<any[]>([]);

  const fetchGuias = async () => {
    try {
      const res = await fetch('/api/guia-despacho');
      const data = await res.json();
      if (data.success) setGuias(data.guias);
    } catch (err) {
      console.error('[v0] Error fetching guías:', err);
    }
  };

  useEffect(() => {
    fetchGuias();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchGuias();
    };

    socket.on('guia-despacho:created', handleUpdate);

    return () => {
      socket.off('guia-despacho:created', handleUpdate);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Guías de Despacho</h1>
        <Link href="/dosificador/guia-despacho/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            <Plus size={20} />
            Nueva Guía
          </Button>
        </Link>
      </div>

      <GuiaDespachoTable
        data={guias}
      />
    </div>
  );
}
