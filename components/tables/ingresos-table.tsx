'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Trash2, Edit2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface IngresosTableProps {
  data: Ingreso[];
  onDelete?: (id: number) => Promise<void>;
  isLoading?: boolean;
  editLink?: (id: number) => string;
}

export function IngresosTable({
  data,
  onDelete,
  isLoading = false,
  editLink = (id) => `/registro/ingresos/${id}/edit`,
}: IngresosTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!onDelete || !confirm('¿Estás seguro de que deseas eliminar este ingreso?')) {
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
        <p className="text-gray-500">No hay ingresos registrados</p>
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
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Descripción</th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Bolívares</th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Dólares</th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">IVA</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tipo</th>
            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.map((ingreso) => (
            <tr key={ingreso.id} className="border-b hover:bg-gray-50 transition">
              <td className="px-6 py-3 text-sm text-gray-600">
                {format(new Date(ingreso.fecha), 'dd MMM yyyy', { locale: es })}
              </td>
              <td className="px-6 py-3 text-sm text-gray-900 font-medium">{ingreso.referencia || '--'}</td>
              <td className="px-6 py-3 text-sm text-gray-600">{ingreso.descripcion?.substring(0, 30) || '--'}</td>
              <td className="px-6 py-3 text-sm text-right text-gray-900 font-medium">
                {ingreso.precioBolivares.toFixed(2)} Bs
              </td>
              <td className="px-6 py-3 text-sm text-right text-gray-600">
                ${(ingreso.precioDolares || 0).toFixed(2)}
              </td>
              <td className="px-6 py-3 text-sm text-right">
                {ingreso.ivaAplicado ? (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                    {(ingreso.ivaMonto || 0).toFixed(2)} Bs
                  </span>
                ) : (
                  <span className="text-gray-400">--</span>
                )}
              </td>
              <td className="px-6 py-3 text-sm">
                {ingreso.esAnticipo ? (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                    Anticipo
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                    Normal
                  </span>
                )}
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
                  <Link href={editLink(ingreso.id)}>
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
                    onClick={() => handleDelete(ingreso.id)}
                    disabled={deletingId === ingreso.id || isLoading}
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
