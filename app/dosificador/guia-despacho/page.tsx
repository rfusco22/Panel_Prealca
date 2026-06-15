import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const metadata = {
  title: 'Guías de Despacho - PREALCA',
};

export default function GuiaDespachoPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Guías de Despacho</h1>
        <Link href="/documentador/guia-despacho/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            <Plus size={20} />
            Nueva Guía
          </Button>
        </Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-blue-900">Este módulo permitirá crear guías de despacho con:</p>
        <ul className="list-disc list-inside mt-3 space-y-2 text-blue-800">
          <li>Tipo de guía (Prealca / Premezclado)</li>
          <li>Selección de cliente y producto</li>
          <li>Cantidad en m³ y precio por m³</li>
          <li>Cálculo automático de IVA (16%)</li>
          <li>Asignación de chofer y unidad de transporte</li>
          <li>Historial de guías emitidas</li>
          <li>Vinculación con Facturas (solo tipo Prealca)</li>
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">Módulo en construcción...</p>
      </div>
    </div>
  );
}
