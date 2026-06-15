'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { IngresosTable } from '@/components/tables/ingresos-table';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface Ingreso {
  id: number;
  bancoId: number;
  clienteId: number;
  descripcion?: string;
  m3?: number;
  resistencia?: string;
  precioBolivares: number;
  precioDolares?: number;
  ivaAplicado: boolean;
  ivaMonto?: number;
  esAnticipo: boolean;
  referencia?: string;
  fecha: Date;
}

export default function IngresosPage() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIngresos();
  }, []);

  const fetchIngresos = async () => {
    try {
      setLoading(true);
      // API call would go here
      setIngresos([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar ingresos';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setIngresos(ingresos.filter(i => i.id !== id));
    } catch (err) {
      console.error('[v0] Error deleting ingreso:', err);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Ingresos</h1>
        <Link href="/registro/ingresos/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            <Plus size={20} />
            Nuevo Ingreso
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
          <p className="text-gray-600">Cargando ingresos...</p>
        </div>
      ) : (
        <IngresosTable
          data={ingresos}
          onDelete={handleDelete}
          editLink={(id) => `/registro/ingresos/${id}/edit`}
        />
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Características de este módulo</h3>
        <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
          <li>Selección de banco, cliente y vendedor</li>
          <li>Cálculo automático de IVA (16%) con checkbox opcional</li>
          <li>Conversión automática de Bolívares a Dólares en tiempo real</li>
          <li>Historial completo de ingresos con filtros</li>
          <li>Exportación a Excel/PDF</li>
          <li>Marca de Anticipos</li>
        </ul>
      </div>
    </div>
  );
}
