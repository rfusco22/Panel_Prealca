'use client';

import { Button } from '@/components/ui/button';
import { Trash2, Edit2, Eye } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface GuiaDespacho {
  id: number;
  clienteId: number;
  unidadId: number;
  desdeLugar: string;
  hastaLugar: string;
  descripcion?: string;
  m3?: number;
  pesoBruto?: number;
  pesoBrutoKg?: number;
  fecha: Date;
  estatus: string;
}

interface GuiaDespachoTableProps {
  data: GuiaDespacho[];
  onDelete: (id: number) => Promise<void>;
  editLink: (id: number) => string;
}

export function GuiaDespachoTable({ data, onDelete, editLink }: GuiaDespachoTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta guía de despacho?')) {
      try {
        setDeletingId(id);
        await onDelete(id);
      } catch (error) {
        console.error('[v0] Error deleting guia despacho:', error);
        alert('Error al eliminar guía de despacho');
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-500">No hay guías de despacho registradas</p>
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
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cliente</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Desde</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Hasta</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">M³</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Peso (kg)</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estatus</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((guia) => (
              <tr key={guia.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-6 py-3 text-sm text-gray-900">
                  {new Date(guia.fecha).toLocaleDateString('es-ES')}
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">Cliente #{guia.clienteId}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{guia.desdeLugar}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{guia.hastaLugar}</td>
                <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                  {guia.m3 ? guia.m3.toFixed(2) : '-'}
                </td>
                <td className="px-6 py-3 text-sm text-gray-900">
                  {guia.pesoBrutoKg ? guia.pesoBrutoKg.toLocaleString('es-ES') : '-'}
                </td>
                <td className="px-6 py-3 text-sm">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      guia.estatus === 'Completada'
                        ? 'bg-green-100 text-green-800'
                        : guia.estatus === 'Pendiente'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {guia.estatus}
                  </span>
                </td>
                <td className="px-6 py-3 text-center">
                  <div className="flex gap-2 justify-center">
                    <Link href={editLink(guia.id)}>
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
                      onClick={() => handleDelete(guia.id)}
                      disabled={deletingId === guia.id}
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
