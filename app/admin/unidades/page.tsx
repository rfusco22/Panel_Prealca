'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UnidadesTable } from '@/components/tables/unidades-table';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface Unidad {
  id: number;
  nombre: string;
  tipo: string;
  placa?: string;
}

export default function AdminUnidadesPage() {
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUnidades();
  }, []);

  const fetchUnidades = async () => {
    try {
      setLoading(true);
      // API call would go here
      setUnidades([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar unidades';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setUnidades(unidades.filter(u => u.id !== id));
    } catch (err) {
      console.error('[v0] Error deleting unidad:', err);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Unidades de Transporte</h1>
        <Link href="/admin/unidades/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            <Plus size={20} />
            Nueva Unidad
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Cargando unidades...</p>
        </div>
      ) : (
        <UnidadesTable
          data={unidades}
          onDelete={handleDelete}
          editLink={(id) => `/admin/unidades/${id}/edit`}
        />
      )}
    </div>
  );
}
