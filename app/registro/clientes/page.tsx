'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ClientesTable } from '@/components/tables/clientes-table';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface Cliente {
  id: number;
  nombre: string;
  rif: string;
  direccion?: string;
  esContribuyenteEspecial: boolean;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      // Aquí iría la llamada a la API
      setClientes([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar clientes';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setClientes(clientes.filter(c => c.id !== id));
    } catch (err) {
      console.error('[v0] Error deleting cliente:', err);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <Link href="/registro/clientes/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            <Plus size={20} />
            Nuevo Cliente
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
          <p className="text-gray-600">Cargando clientes...</p>
        </div>
      ) : (
        <ClientesTable
          data={clientes}
          onDelete={handleDelete}
          editLink={(id) => `/registro/clientes/${id}/edit`}
        />
      )}
    </div>
  );
}
