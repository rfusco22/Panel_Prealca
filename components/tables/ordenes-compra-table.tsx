'use client';

import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { formatearFecha } from '@/lib/fecha';
interface OrdenCompra {
  id: number;
  fecha: string;
  tipo: string;
  proveedorNombre: string;
  productoNombre: string;
  cantidadM3: number;
  total: number;
}

export interface OrdenesCompraTableProps {
  data: OrdenCompra[];
  onDelete: (id: number) => Promise<void>;
}

export function OrdenesCompraTable({ data, onDelete }: OrdenesCompraTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta orden de compra?')) {
      try {
        setDeletingId(id);
        await onDelete(id);
      } catch (error) {
        console.error('[v0] Error deleting orden compra:', error);
        alert('Error al eliminar orden de compra');
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-500">No hay órdenes de compra registradas</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tipo</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Proveedor</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Producto</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">M³</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((orden) => (
              <tr key={orden.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-6 py-3 text-sm text-gray-900">
                  {formatearFecha(orden.fecha)}
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">{orden.tipo}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{orden.proveedorNombre}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{orden.productoNombre}</td>
                <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                  {orden.cantidadM3.toFixed(2)}
                </td>
                <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                  Bs. {orden.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Link href={`/registro/ordenes-compra/${orden.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-blue-600"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(orden.id)}
                      disabled={deletingId === orden.id}
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
