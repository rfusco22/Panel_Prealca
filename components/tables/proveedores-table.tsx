'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Trash2, Edit2 } from 'lucide-react';

interface Proveedor {
  id: number;
  nombre: string;
  rif: string;
  direccion?: string;
  clasificacionGasto?: string;
  esContribuyenteEspecial: boolean;
}

interface ProveedoresTableProps {
  data: Proveedor[];
  onDelete?: (id: number) => Promise<void>;
  isLoading?: boolean;
  editLink?: (id: number) => string;
}

export function ProveedoresTable({
  data,
  onDelete,
  isLoading = false,
  editLink = (id) => `/registro/proveedores/${id}/edit`,
}: ProveedoresTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!onDelete || !confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
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
        <p className="text-gray-500">No hay proveedores registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nombre</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">RIF</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Dirección</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Clasificación</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Contribuyente Especial</th>
            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.map((proveedor) => (
            <tr key={proveedor.id} className="border-b hover:bg-gray-50 transition">
              <td className="px-6 py-3 text-sm text-gray-900">{proveedor.nombre}</td>
              <td className="px-6 py-3 text-sm text-gray-600">{proveedor.rif}</td>
              <td className="px-6 py-3 text-sm text-gray-600">{proveedor.direccion || '--'}</td>
              <td className="px-6 py-3 text-sm text-gray-600">{proveedor.clasificacionGasto || '--'}</td>
              <td className="px-6 py-3 text-sm">
                {proveedor.esContribuyenteEspecial ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                    Sí
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">No</span>
                )}
              </td>
              <td className="px-6 py-3 text-center">
                <div className="flex justify-center gap-2">
                  <Link href={editLink(proveedor.id)}>
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
                    onClick={() => handleDelete(proveedor.id)}
                    disabled={deletingId === proveedor.id || isLoading}
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
