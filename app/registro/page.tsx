import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard Registro - PREALCA',
};

export default function RegistroPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">Dashboard de Registro</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Proveedores</h2>
          <p className="text-gray-600 text-sm mb-4">Crear y gestionar proveedores</p>
          <Link href="/registro/proveedores">
            <Button className="bg-blue-600 hover:bg-blue-700">Ver Proveedores</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Clientes</h2>
          <p className="text-gray-600 text-sm mb-4">Crear y gestionar clientes</p>
          <Link href="/registro/clientes">
            <Button className="bg-green-600 hover:bg-green-700">Ver Clientes</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-600">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bancos</h2>
          <p className="text-gray-600 text-sm mb-4">Registrar cuentas bancarias</p>
          <Link href="/registro/bancos">
            <Button className="bg-purple-600 hover:bg-purple-700">Ver Bancos</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-600">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ingresos</h2>
          <p className="text-gray-600 text-sm mb-4">Registrar ingresos bancarios</p>
          <Link href="/registro/ingresos">
            <Button className="bg-indigo-600 hover:bg-indigo-700">Ver Ingresos</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-600">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Egresos</h2>
          <p className="text-gray-600 text-sm mb-4">Registrar egresos/gastos</p>
          <Link href="/registro/egresos">
            <Button className="bg-orange-600 hover:bg-orange-700">Ver Egresos</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-600">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Facturas</h2>
          <p className="text-gray-600 text-sm mb-4">Registrar y gestionar facturas</p>
          <Link href="/registro/facturas">
            <Button className="bg-red-600 hover:bg-red-700">Ver Facturas</Button>
          </Link>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-8">
        <h3 className="font-semibold text-green-900 mb-2">Resumen del Mes</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-green-700">Ingresos Registrados</p>
            <p className="text-2xl font-bold text-green-900">--</p>
          </div>
          <div>
            <p className="text-sm text-green-700">Egresos Registrados</p>
            <p className="text-2xl font-bold text-green-900">--</p>
          </div>
          <div>
            <p className="text-sm text-green-700">Facturas Emitidas</p>
            <p className="text-2xl font-bold text-green-900">--</p>
          </div>
          <div>
            <p className="text-sm text-green-700">Saldo Neto</p>
            <p className="text-2xl font-bold text-green-900">--</p>
          </div>
        </div>
      </div>
    </div>
  );
}
