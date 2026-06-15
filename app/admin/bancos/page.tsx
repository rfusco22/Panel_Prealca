'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BancosTable } from '@/components/tables/bancos-table';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface Banco {
  id: number;
  nombreBanco: string;
  numeroCuenta: string;
  titularCuenta: string;
  cedula?: string;
}

export default function AdminBancosPage() {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBancos();
  }, []);

  const fetchBancos = async () => {
    try {
      setLoading(true);
      // API call would go here
      setBancos([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar bancos';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setBancos(bancos.filter(b => b.id !== id));
    } catch (err) {
      console.error('[v0] Error deleting banco:', err);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Cuentas Bancarias</h1>
        <Link href="/admin/bancos/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            <Plus size={20} />
            Nueva Cuenta
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
          <p className="text-gray-600">Cargando cuentas bancarias...</p>
        </div>
      ) : (
        <BancosTable
          data={bancos}
          onDelete={handleDelete}
          editLink={(id) => `/admin/bancos/${id}/edit`}
        />
      )}
    </div>
  );
}
