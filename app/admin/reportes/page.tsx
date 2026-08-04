'use client';

import Link from 'next/link';
import { Users, Truck, Building2, BarChart3, ArrowRight } from 'lucide-react';

const reports = [
  {
    title: 'Clientes',
    subtitle: 'Estado de Cuenta',
    desc: 'Ingresos vs Guías de Despacho / Factura, M³ despachados y comisiones de venta por cliente',
    href: '/admin/reportes/clientes',
    icon: Users,
    color: 'bg-blue-50 text-blue-600',
    items: [
      'Estado de Cuenta: Ingreso - Guía / Factura',
      'Producto despachado: M³ por guía de despacho',
      'Comisiones de venta: M³ × comisión del vendedor',
    ],
  },
  {
    title: 'Proveedores',
    subtitle: 'Estado de Cuenta',
    desc: 'Egresos vs Órdenes de Compra / Factura por proveedor con detalle de clasificación',
    href: '/admin/reportes/proveedores',
    icon: Truck,
    color: 'bg-orange-50 text-orange-600',
    items: [
      'Estado de Cuenta: Egreso - Orden de Compra / Factura',
      'Detalle por clasificación de gasto',
      'Totales en Bs y USD por proveedor',
    ],
  },
  {
    title: 'Bancos',
    subtitle: 'Conciliación',
    desc: 'Relación del estado de cuenta descargado contra ingresos y egresos por banco',
    href: '/admin/reportes/bancos',
    icon: Building2,
    color: 'bg-emerald-50 text-emerald-600',
    items: [
      'Conciliación: Ingresos vs Egresos por banco',
      'Saldo calculado en Bs y USD',
      'Detalle de movimientos por referencia',
    ],
  },
];

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-slate-900 rounded-xl"><BarChart3 className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reportes y Estadísticas</h1>
          <p className="text-sm text-slate-500">Exportación a Excel y PDF · Filtros por cliente, proveedor y banco</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <Link key={r.href} href={r.href}>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group h-full flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${r.color} shrink-0`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition">{r.title}</h3>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{r.subtitle}</p>
                  </div>
                </div>

                <p className="text-sm text-slate-500 mb-4">{r.desc}</p>

                <ul className="space-y-2 mb-5 flex-1">
                  {r.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 group-hover:text-blue-800 transition pt-3 border-t border-slate-100">
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
