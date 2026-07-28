'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Package, Users, Building2, UserCircle, DollarSign, ArrowLeftFromLine,
  FileText, ShoppingCart, LayoutDashboard, LogOut, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/registro', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/registro/proveedores', label: 'Proveedores', icon: Package },
  { href: '/registro/clientes', label: 'Clientes', icon: Users },
  { href: '/registro/vendedores', label: 'Vendedores', icon: UserCircle },
  { href: '/registro/bancos', label: 'Bancos', icon: Building2 },
  { href: '/registro/ingresos', label: 'Ingresos', icon: DollarSign },
  { href: '/registro/egresos', label: 'Egresos', icon: ArrowLeftFromLine },
  { href: '/registro/facturas', label: 'Facturas', icon: FileText },
  { href: '/registro/ordenes-compra', label: 'Órdenes de Compra', icon: ShoppingCart },
];

export function NavbarRegistro() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch {}
    router.push('/auth/login');
  };

  return (
    <>
      <nav className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-1 rounded-md hover:bg-slate-100">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link href="/registro" className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-900">PREALCA</span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">Registro</span>
          </Link>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium">
          <LogOut size={16} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </nav>

      <div className="flex">
        <aside className={`${mobileOpen ? 'block' : 'hidden'} lg:block w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-57px)] p-4 fixed lg:sticky top-[57px] z-40 overflow-y-auto`}>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/registro' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {mobileOpen && (
            <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
          )}
        </div>
      </div>
    </>
  );
}
