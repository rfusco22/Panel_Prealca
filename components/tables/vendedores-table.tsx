"use client";

import { Pencil, Trash2 } from "lucide-react";
import { formatearFecha } from '@/lib/fecha';

interface Vendedor {
  id: number;
  nombre: string;
  cedula: string;
  telefono?: string;
  direccion?: string;
  createdAt?: string;
}

interface VendedoresTableProps {
  data: Vendedor[];
  isLoading: boolean;
  error?: string;
  onEdit: (vendedor: Vendedor) => void;
  onDelete: (id: number) => void;
}

export default function VendedoresTable({ data, isLoading, error, onEdit, onDelete }: VendedoresTableProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Cargando directorio de vendedores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-lg">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
        <p className="text-gray-500">No hay vendedores registrados en el sistema.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 font-semibold text-gray-700">ID</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Nombre</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Cédula</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Teléfono</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Dirección</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Fecha de Registro</th>
            <th className="px-4 py-3 font-semibold text-gray-700 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((vendedor) => (
            <tr key={vendedor.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-500">#{vendedor.id}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{vendedor.nombre}</td>
              <td className="px-4 py-3 text-gray-700">{vendedor.cedula}</td>
              <td className="px-4 py-3 text-gray-600">{vendedor.telefono || 'N/A'}</td>
              <td className="px-4 py-3 text-gray-500 truncate max-w-xs">{vendedor.direccion || 'N/A'}</td>
              <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                {formatearFecha(vendedor.createdAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(vendedor)}
                    className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(vendedor.id)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
