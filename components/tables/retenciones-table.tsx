'use client';

import { Button } from '@/components/ui/button';
import { Trash2, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface Retencion {
  id: number;
  tipoRetencion: string;
  facturaId: number;
  numeroFactura: string;
  baseImponible: number;
  porcentajeRetencion: number;
  montoRetencion: number;
  referencia?: string;
  fecha: Date;
}

interface RetencionesTableProps {
  data: Retencion[];
  onDelete: (id: number) => Promise<void>;
  editLink: (id: number) => string;
}

export function RetencionesTable({ data, onDelete, editLink }: RetencionesTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta retención?')) {
      try {
        setDeletingId(id);
        await onDelete(id);
      } catch (error) {
        console.error('[v0] Error deleting retencion:', error);
        alert('Error al eliminar retención');
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-500">No hay retenciones registradas</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tipo</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Factura</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Base Imponible</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Porcentaje</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Monto Retención</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Referencia</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((retencion) => (
              <tr key={retencion.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-6 py-3 text-sm font-semibold text-gray-900">{retencion.tipoRetencion}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{retencion.numeroFactura}</td>
                <td className="px-6 py-3 text-sm text-gray-900">
                  Bs. {retencion.baseImponible.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-3 text-sm text-gray-900 font-medium">{retencion.porcentajeRetencion}%</td>
                <td className="px-6 py-3 text-sm font-semibold text-red-600">
                  Bs. {retencion.montoRetencion.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">{retencion.referencia || '-'}</td>
                <td className="px-6 py-3 text-sm text-gray-600">
                  {new Date(retencion.fecha).toLocaleDateString('es-ES')}
                </td>
                <td className="px-6 py-3 text-center">
                  <div className="flex gap-2 justify-center">
                    <Link href={editLink(retencion.id)}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(retencion.id)}
                      disabled={deletingId === retencion.id}
                      title="Eliminar"
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
    </div>
  );
}
