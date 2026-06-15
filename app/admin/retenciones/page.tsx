import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const metadata = {
  title: 'Retenciones de Impuestos - PREALCA',
};

export default function RetencionesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Retenciones de Impuestos</h1>
        <Link href="/admin/retenciones/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            <Plus size={20} />
            Nueva Retención
          </Button>
        </Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-blue-900">Este módulo permitirá gestionar retenciones de impuestos:</p>
        <ul className="list-disc list-inside mt-3 space-y-2 text-blue-800">
          <li>Solo aplica a clientes contribuyentes especiales</li>
          <li>Retención del 75% del IVA de la factura</li>
          <li>Vinculación automática con facturas</li>
          <li>Cálculo automático del monto retenido</li>
          <li>Historial de retenciones emitidas</li>
          <li>Reporte de retenciones por período</li>
          <li>Exportación de comprobantes</li>
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">Módulo en construcción...</p>
      </div>
    </div>
  );
}
