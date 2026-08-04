'use client';

import Link from 'next/link';
import { DollarSign, TrendingDown, ShoppingCart, Shield, Activity, Globe, BarChart3, ArrowRight } from 'lucide-react';

const reports = [
  { title: 'Reporte de Ingresos', desc: 'Análisis detallado de ingresos por período, banco y vendedor', href: '/admin/reportes/ingresos', icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
  { title: 'Reporte de Egresos', desc: 'Análisis de gastos por clasificación, tipo y proveedor', href: '/admin/reportes/egresos', icon: TrendingDown, color: 'bg-red-50 text-red-600' },
  { title: 'Reporte de Ventas', desc: 'Estadísticas de facturas, guías y productos vendidos', href: '/admin/reportes/ventas', icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
  { title: 'Reporte de Retenciones', desc: 'Detalle de retenciones de IVA por cliente y período', href: '/admin/reportes/retenciones', icon: Shield, color: 'bg-purple-50 text-purple-600' },
  { title: 'Estado Financiero', desc: 'Balance de ingresos vs egresos con gráficos', href: '/admin/reportes/financiero', icon: Activity, color: 'bg-orange-50 text-orange-600' },
  { title: 'Conversión de Monedas', desc: 'Tasa de cambio oficial del BCV', href: '/admin/reportes/monedas', icon: Globe, color: 'bg-cyan-50 text-cyan-600' },
];

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-slate-900 rounded-xl"><BarChart3 className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reportes y Estadísticas</h1>
          <p className="text-sm text-slate-500">Exportación a Excel y PDF · Gráficos interactivos · Filtros por fecha</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <Link key={r.href} href={r.href}>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group h-full flex flex-col">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${r.color} shrink-0`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition">{r.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{r.desc}</p>
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-blue-600 group-hover:text-blue-800 transition">
                  Ver Reporte <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
