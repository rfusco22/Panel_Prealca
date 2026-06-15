'use client';

import { Button } from '@/components/ui/button';
import { Trash2, Edit2, FileText } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface Factura {
  id: number;
  clienteId: number;
  numeroFactura: string;
  tipoFactura: string;
  descripcion?: string;
  montoTotal: number;
  iva?: number;
  fechaEmision: Date;
  estatus: string;
}

interface FacturasTableProps {
  data: Factura[];
  onDelete: (id: number) => Promise<void>;
  editLink: (id: number) => string;
  pdfLink?: (id: number) => string;
}

export function FacturasTable({ data, onDelete, editLink, pdfLink }: FacturasTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta factura?')) {
      try {
        setDeletingId(id);
        await onDelete(id);
      } catch (error) {
        console.error('[v0] Error deleting factura:', error);
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
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nº Factura</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tipo</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cliente</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Monto</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">IVA</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estatus</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((factura) => (
              <tr key={factura.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-6 py-3 text-sm font-semibold text-gray-900">{factura.numeroFactura}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{factura.tipoFactura}</td>
                <td className="px-6 py-3 text-sm text-gray-600">Cliente #{factura.clienteId}</td>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                  Bs. {factura.montoTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">
                  {factura.iva ? `Bs. ${factura.iva.toLocaleString('es-ES', { minimumFractionDigits: 2 })}` : 'N/A'}
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">
                  {new Date(factura.fechaEmision).toLocaleDateString('es-ES')}
                </td>
                <td className="px-6 py-3 text-sm">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      factura.estatus === 'Pagada'
                        ? 'bg-green-100 text-green-800'
                        : factura.estatus === 'Pendiente'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {factura.estatus}
                  </span>
                </td>
                <td className="px-6 py-3 text-center">
                  <div className="flex gap-2 justify-center">
                    {pdfLink && (
                      <a href={pdfLink(factura.id)} target="_blank" rel="noopener noreferrer">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          title="Descargar PDF"
                        >
                          <FileText size={16} />
                        </Button>
                      </a>
                    )}
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
