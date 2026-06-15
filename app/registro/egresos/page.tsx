'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { EgresosTable } from '@/components/tables/egresos-table';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface Egreso {
  id: number;
  bancoId: number;
  proveedorId: number;
  clasificacionGasto: string;
  tipoGasto: string;
  descripcion?: string;
  montoBolivares: number;
  montoDolares?: number;
  referencia?: string;
  fecha: Date;
}

export default function EgresosPage() {
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEgresos();
  }, []);

  const fetchEgresos = async () => {
    try {
      setLoading(true);
      // API call would go here
      setEgresos([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar egresos';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setEgresos(egresos.filter(e => e.id !== id));
    } catch (err) {
      console.error('[v0] Error deleting egreso:', err);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Egresos / Gastos</h1>
        <Link href="/registro/egresos/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            <Plus size={20} />
            Nuevo Egreso
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
          <p className="text-gray-600">Cargando egresos...</p>
        </div>
      ) : (
        <EgresosTable
          data={egresos}
          onDelete={handleDelete}
          editLink={(id) => `/registro/egresos/${id}/edit`}
        />
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Características de este módulo</h3>
        <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
          <li>Clasificación dinámica de gastos (Mantenimiento, Producción, Administración, etc.)</li>
          <li>Tipos de gasto configurables según clasificación</li>
          <li>Asociación con proveedores</li>
          <li>Conversión automática de Bolívares a Dólares en tiempo real</li>
          <li>Historial con filtros por período</li>
          <li>Exportación a Excel/PDF</li>
          <li>Tracking detallado de gastos</li>
        </ul>
      </div>
    </div>
  );
}
