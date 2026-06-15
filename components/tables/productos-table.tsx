'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Trash2, Edit2 } from 'lucide-react';

interface Producto {
  id: number;
  nombre: string;
  resistencia?: string;
  descripcion?: string;
}

interface ProductosTableProps {
  data: Producto[];
  onDelete?: (id: number) => Promise<void>;
  isLoading?: boolean;
  editLink?: (id: number) => string;
}

export function ProductosTable({
  data,
  onDelete,
  isLoading = false,
  editLink = (id) => `/admin/productos/${id}/edit`,
}: ProductosTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!onDelete || !confirm('¿Estás seguro de que deseas eliminar este producto?')) {
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
        <p className="text-gray-500">No hay productos registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nombre</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Resistencia</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Descripción</th>
            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.map((producto) => (
            <tr key={producto.id} className="border-b hover:bg-gray-50 transition">
              <td className="px-6 py-3 text-sm font-medium text-gray-900">{producto.nombre}</td>
              <td className="px-6 py-3 text-sm text-gray-600">{producto.resistencia || '--'}</td>
              <td className="px-6 py-3 text-sm text-gray-600">{producto.descripcion?.substring(0, 50) || '--'}...</td>
              <td className="px-6 py-3 text-center">
                <div className="flex justify-center gap-2">
                  <Link href={editLink(producto.id)}>
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
                    onClick={() => handleDelete(producto.id)}
                    disabled={deletingId === producto.id || isLoading}
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
