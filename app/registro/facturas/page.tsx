import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const metadata = {
  title: 'Facturas - PREALCA',
};

export default function FacturasPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Facturas</h1>
        <Link href="/registro/facturas/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            <Plus size={20} />
            Nueva Factura
          </Button>
        </Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-blue-900">Este módulo permitirá emitir facturas con:</p>
        <ul className="list-disc list-inside mt-3 space-y-2 text-blue-800">
          <li>Vinculación automática con Guías de Despacho</li>
          <li>Autocomplete de datos de cliente y producto</li>
          <li>Forma de pago (Contado / Crédito)</li>
          <li>Cálculo automático de IVA</li>
          <li>Generación automática de Ingreso si forma_pago = Contado</li>
          <li>Estados de factura (Pendiente, Cancelada, Anulada)</li>
          <li>Integración con retenciones de impuestos</li>
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">Módulo en construcción...</p>
      </div>
    </div>
  );
}
