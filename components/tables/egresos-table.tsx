'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Trash2, Edit2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface EgresosTableProps {
  data: Egreso[];
  onDelete?: (id: number) => Promise<void>;
  isLoading?: boolean;
  editLink?: (id: number) => string;
}

export function EgresosTable({
  data,
  onDelete,
  isLoading = false,
  editLink = (id) => `/registro/egresos/${id}/edit`,
}: EgresosTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!onDelete || !confirm('¿Estás seguro de que deseas eliminar este egreso?')) {
      return;
    }

    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay egresos registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Referencia</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Clasificación</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tipo</th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Bolívares</th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Dólares</th>
            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.map((egreso) => (
            <tr key={egreso.id} className="border-b hover:bg-gray-50 transition">
              <td className="px-6 py-3 text-sm text-gray-600">
                {format(new Date(egreso.fecha), 'dd MMM yyyy', { locale: es })}
              </td>
              <td className="px-6 py-3 text-sm text-gray-900 font-medium">{egreso.referencia || '--'}</td>
              <td className="px-6 py-3 text-sm text-gray-600">{egreso.clasificacionGasto}</td>
              <td className="px-6 py-3 text-sm">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                  {egreso.tipoGasto}
                </span>
              </td>
              <td className="px-6 py-3 text-sm text-right text-gray-900 font-medium">
                {egreso.montoBolivares.toFixed(2)} Bs
              </td>
              <td className="px-6 py-3 text-sm text-right text-gray-600">
                ${(egreso.montoDolares || 0).toFixed(2)}
              </td>
              <td className="px-6 py-3 text-center">
                <div className="flex justify-center gap-2">
                  <Button
                    size="sm"
                    className="bg-gray-600 hover:bg-gray-700 text-white p-2"
                    title="Ver detalles"
                  >
                    <Eye size={16} />
                  </Button>
                  <Link href={editLink(egreso.id)}>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2"
                    >
                      <Edit2 size={16} />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white p-2"
                    onClick={() => handleDelete(egreso.id)}
                    disabled={deletingId === egreso.id || isLoading}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
