import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard Documentador - PREALCA',
};

export default function DocumentadorPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">Dashboard de Documentador</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Guías de Despacho</h2>
          <p className="text-gray-600 text-sm mb-4">Crear y gestionar guías de despacho de productos</p>
          <Link href="/documentador/guia-despacho">
            <Button className="bg-blue-600 hover:bg-blue-700">Ver Guías</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Consultar Datos</h2>
          <p className="text-gray-600 text-sm mb-4">Consultar productos, clientes e información disponible</p>
          <Link href="/documentador/consultas">
            <Button className="bg-green-600 hover:bg-green-700">Consultar</Button>
          </Link>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
        <h3 className="font-semibold text-blue-900 mb-2">Actividad Reciente</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• Guías de despacho creadas hoy: --</p>
          <p>• Últimas guías registradas: --</p>
          <p>• Productos disponibles: --</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          <strong>Nota:</strong> El módulo de documentador está limitado a la creación de guías de despacho y consulta de información. 
          No tiene acceso a módulos de gestión administrativa.
        </p>
      </div>
    </div>
  );
}
