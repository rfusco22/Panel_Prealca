'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ProveedoresTable } from '@/components/tables/proveedores-table';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface Proveedor {
  id: number;
  nombre: string;
  rif: string;
  direccion?: string;
  clasificacionGasto?: string;
  esContribuyenteEspecial: boolean;
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      // Aquí iría la llamada a la API
      // const response = await fetch('/api/proveedores');
      // const data = await response.json();
      // setProveedores(data);
      
      // Por ahora, datos vacíos
      setProveedores([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar proveedores';
      setError(message);
      console.error('[v0] Error fetching proveedores:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      // Aquí iría la llamada a la API para eliminar
      // await fetch(`/api/proveedores/${id}`, { method: 'DELETE' });
      setProveedores(proveedores.filter(p => p.id !== id));
    } catch (err) {
      console.error('[v0] Error deleting proveedor:', err);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Proveedores</h1>
        <Link href="/registro/proveedores/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            <Plus size={20} />
            Nuevo Proveedor
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
          <p className="text-gray-600">Cargando proveedores...</p>
        </div>
      ) : (
        <ProveedoresTable
          data={proveedores}
          onDelete={handleDelete}
          editLink={(id) => `/registro/proveedores/${id}/edit`}
        />
      )}
    </div>
  );
}
