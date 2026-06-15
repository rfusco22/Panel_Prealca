import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Reportes - PREALCA',
};

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Reportes y Estadísticas</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reporte de Ingresos</h2>
          <p className="text-gray-600 text-sm mb-4">Análisis detallado de ingresos por período, banco y cliente</p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Ver Reporte</Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reporte de Egresos</h2>
          <p className="text-gray-600 text-sm mb-4">Análisis de gastos por clasificación, tipo y proveedor</p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Ver Reporte</Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reporte de Ventas</h2>
          <p className="text-gray-600 text-sm mb-4">Estadísticas de facturas, guías y productos vendidos</p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Ver Reporte</Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reporte de Retenciones</h2>
          <p className="text-gray-600 text-sm mb-4">Detalle de retenciones de IVA por cliente y período</p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Ver Reporte</Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado Financiero</h2>
          <p className="text-gray-600 text-sm mb-4">Balance de ingresos vs egresos con gráficos</p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Ver Reporte</Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversión de Monedas</h2>
          <p className="text-gray-600 text-sm mb-4">Historial de tasas de cambio y conversiones realizadas</p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Ver Reporte</Button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-semibold text-yellow-900 mb-2">Próximas funcionalidades</h3>
        <ul className="list-disc list-inside text-yellow-800 space-y-1 text-sm">
          <li>Exportación a Excel y PDF de todos los reportes</li>
          <li>Gráficos interactivos con Recharts</li>
          <li>Filtros avanzados por rango de fechas</li>
          <li>Comparativas períodos anteriores</li>
          <li>Programación de reportes automáticos</li>
        </ul>
      </div>
    </div>
  );
}
