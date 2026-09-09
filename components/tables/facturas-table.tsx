'use client';

import { Button } from '@/components/ui/button';
import { Trash2, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { formatearFecha } from '@/lib/fecha';

interface Factura {
  id: number;
  clienteId: number;
  clienteNombre?: string;
  formaPago: string;
  comprobanteRetencion?: string;
  subtotal?: number;
  ivaMonto?: number;
  montoRetencion?: number;
  total: number;
  estado?: string;
  fecha: string;
}

interface FacturasTableProps {
  data: Factura[];
  onDelete: (id: number) => Promise<void>;
  editLink: (id: number) => string;
}

export function FacturasTable({ data, onDelete, editLink }: FacturasTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta factura?')) {
      try {
        setDeletingId(id);
        await onDelete(id);
      } catch (error) {
        console.error('Error deleting factura:', error);
        alert('Error al eliminar factura');
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-500">No hay facturas registradas</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nº</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cliente</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Forma de Pago</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estatus</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((factura) => (
              <tr key={factura.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-6 py-3 text-sm font-semibold text-gray-900">F-{factura.id}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{factura.clienteNombre || `Cliente #${factura.clienteId}`}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{factura.formaPago || '—'}</td>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                  Bs. {Number(factura.total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">
                  {formatearFecha(factura.fecha)}
                </td>
                <td className="px-6 py-3 text-sm">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      factura.estado === 'Pagada'
                        ? 'bg-green-100 text-green-800'
                        : factura.estado === 'Anulada'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {factura.estado || 'Pendiente'}
                  </span>
                </td>
                <td className="px-6 py-3 text-center">
                  <div className="flex gap-2 justify-center">
                    <Link href={editLink(factura.id)}>
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
                      onClick={() => handleDelete(factura.id)}
                      disabled={deletingId === factura.id}
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
