'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Trash2, Edit2 } from 'lucide-react';

interface Unidad {
  id: number;
  nombre: string;
  tipo: string;
  placa?: string;
}

interface UnidadesTableProps {
  data: Unidad[];
  onDelete?: (id: number) => Promise<void>;
  isLoading?: boolean;
  editLink?: (id: number) => string;
}

export function UnidadesTable({
  data,
  onDelete,
  isLoading = false,
  editLink = (id) => `/admin/unidades/${id}/edit`,
}: UnidadesTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!onDelete || !confirm('¿Estás seguro de que deseas eliminar esta unidad?')) {
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
        <p className="text-gray-500">No hay unidades registradas</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nombre</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tipo</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Placa</th>
            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.map((unidad) => (
            <tr key={unidad.id} className="border-b hover:bg-gray-50 transition">
              <td className="px-6 py-3 text-sm font-medium text-gray-900">{unidad.nombre}</td>
              <td className="px-6 py-3 text-sm text-gray-600">{unidad.tipo}</td>
              <td className="px-6 py-3 text-sm text-gray-600">{unidad.placa || '--'}</td>
              <td className="px-6 py-3 text-center">
                <div className="flex justify-center gap-2">
                  <Link href={editLink(unidad.id)}>
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
                    onClick={() => handleDelete(unidad.id)}
                    disabled={deletingId === unidad.id || isLoading}
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
