import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard Admin - PREALCA',
};

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">Dashboard Administrativo</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Gestión de Bancos</h2>
          <p className="text-gray-600 text-sm mb-4">Administra cuentas bancarias y datos de bancos</p>
          <Link href="/admin/bancos">
            <Button className="bg-blue-600 hover:bg-blue-700">Ver Bancos</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos</h2>
          <p className="text-gray-600 text-sm mb-4">Gestiona el catálogo de productos</p>
          <Link href="/admin/productos">
            <Button className="bg-green-600 hover:bg-green-700">Ver Productos</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-600">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Unidades</h2>
          <p className="text-gray-600 text-sm mb-4">Gestiona unidades de transporte</p>
          <Link href="/admin/unidades">
            <Button className="bg-purple-600 hover:bg-purple-700">Ver Unidades</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-600">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Retenciones</h2>
          <p className="text-gray-600 text-sm mb-4">Gestiona retenciones de impuestos</p>
          <Link href="/admin/retenciones">
            <Button className="bg-orange-600 hover:bg-orange-700">Ver Retenciones</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-600">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración</h2>
          <p className="text-gray-600 text-sm mb-4">Tasas de cambio y configuración del sistema</p>
          <Link href="/admin/settings">
            <Button className="bg-red-600 hover:bg-red-700">Configurar</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-600">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reportes</h2>
          <p className="text-gray-600 text-sm mb-4">Ver reportes y estadísticas</p>
          <Link href="/admin/reportes">
            <Button className="bg-indigo-600 hover:bg-indigo-700">Ver Reportes</Button>
          </Link>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
        <h3 className="font-semibold text-blue-900 mb-2">Estadísticas Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-blue-700">Ingresos Totales</p>
            <p className="text-2xl font-bold text-blue-900">--</p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Egresos Totales</p>
            <p className="text-2xl font-bold text-blue-900">--</p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Clientes</p>
            <p className="text-2xl font-bold text-blue-900">--</p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Proveedores</p>
            <p className="text-2xl font-bold text-blue-900">--</p>
          </div>
        </div>
      </div>
    </div>
  );
}
