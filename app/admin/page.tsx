import Link from 'next/link';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { redirect } from 'next/navigation';
import { 
  Building2, 
  Package, 
  Truck, 
  Receipt, 
  Settings, 
  PieChart, 
  TrendingUp, 
  Wallet, 
  Users, 
  ArrowRight
} from 'lucide-react';

export const metadata = {
  title: 'Dashboard Admin - PREALCA',
};

export default async function AdminPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  if (!session.userId || session.role !== 'admin') {
    redirect('/auth/login');
  }

  const modules = [
    { title: 'Gestión de Bancos', desc: 'Administra cuentas y datos bancarios', href: '/admin/bancos', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Productos', desc: 'Gestiona el catálogo de productos', href: '/admin/productos', icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Unidades', desc: 'Control de unidades de transporte', href: '/admin/unidades', icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Retenciones', desc: 'Gestión de retenciones de impuestos', href: '/admin/retenciones', icon: Receipt, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Reportes', desc: 'Estadísticas y métricas generales', href: '/admin/reportes', icon: PieChart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Configuración', desc: 'Tasas de cambio y ajustes', href: '/admin/settings', icon: Settings, color: 'text-slate-600', bg: 'bg-slate-100' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out p-4 md:p-8">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bienvenido de nuevo</h1>
          <p className="text-slate-500 mt-1">Aquí tienes un resumen de tu panel administrativo.</p>
        </div>
      </div>

      {/* Stats Row (Minimalist) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ingresos Totales', value: '$0.00', icon: TrendingUp },
          { label: 'Egresos Totales', value: '$0.00', icon: Wallet },
          { label: 'Clientes Activos', value: '0', icon: Users },
          { label: 'Proveedores', value: '0', icon: Building2 },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <stat.icon className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modules Grid (Animated Cards) */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Módulos del Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod, i) => (
            <Link href={mod.href} key={i}>
              <div className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full relative overflow-hidden">
                {/* Decorative background circle */}
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 duration-500 ${mod.bg}`} />
                
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className={`p-3 rounded-xl ${mod.bg} ${mod.color} group-hover:scale-110 transition-transform duration-300`}>
                    <mod.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{mod.title}</h3>
                </div>
                <p className="text-slate-500 text-sm mb-6 relative z-10">{mod.desc}</p>
                
                <div className="flex items-center text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors relative z-10">
                  Acceder 
                  <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}