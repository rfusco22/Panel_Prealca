"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Users, UserCircle, Package, Truck, Receipt,
  Building2, FileText, ShoppingCart, TrendingUp, TrendingDown,
  Boxes, HardHat, AlertTriangle, LogOut, Eye, ChevronDown, UsersRound, Shield, ArrowLeftRight, X, BarChart3
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  href: string;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: any;
  items: MenuItem[];
}

const topItems: MenuItem[] = [
  { id: "alerta", label: "Alertas", icon: AlertTriangle, href: "/gerencia/alerta" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/gerencia" },
  { id: "reportes", label: "Reportes", icon: BarChart3, href: "/gerencia/reportes" },
  { id: "brecha", label: "Brecha Cambiaria", icon: ArrowLeftRight, href: "/gerencia/brecha-cambiaria" },
  { id: "usuarios", label: "Gestión de Usuarios", icon: UsersRound, href: "/gerencia/users" },
  { id: "auditoria", label: "Auditoría", icon: Shield, href: "/gerencia/audit-log" },
];

const groups: MenuGroup[] = [
  {
    id: "directorio",
    label: "Directorio",
    icon: Users,
    items: [
      { id: "clientes", label: "Clientes", icon: Users, href: "/gerencia/clientes" },
      { id: "proveedores", label: "Proveedores", icon: Package, href: "/gerencia/proveedores" },
      { id: "vendedores", label: "Vendedores", icon: UserCircle, href: "/gerencia/vendedores" },
      { id: "bancos", label: "Bancos", icon: Building2, href: "/gerencia/bancos" },
    ],
  },
  {
    id: "contabilidad",
    label: "Contabilidad",
    icon: Receipt,
    items: [
      { id: "facturas", label: "Facturas", icon: FileText, href: "/gerencia/facturas" },
      { id: "ordenes", label: "Órdenes de Compra", icon: ShoppingCart, href: "/gerencia/ordenes-compra" },
      { id: "ingresos", label: "Ingresos", icon: TrendingUp, href: "/gerencia/ingresos" },
      { id: "egresos", label: "Egresos", icon: TrendingDown, href: "/gerencia/egresos" },
      { id: "retenciones", label: "Retenciones", icon: Receipt, href: "/gerencia/retenciones" },
    ],
  },
  {
    id: "operaciones",
    label: "Operaciones",
    icon: Truck,
    items: [
      { id: "productos", label: "Productos", icon: Package, href: "/gerencia/productos" },
      { id: "stock", label: "Inventario", icon: Boxes, href: "/gerencia/stock" },
      { id: "pedidos", label: "Pedidos", icon: ShoppingCart, href: "/gerencia/pedidos" },
      { id: "unidades", label: "Unidades", icon: Truck, href: "/gerencia/unidades" },
      { id: "choferes", label: "Choferes", icon: HardHat, href: "/gerencia/choferes" },
      { id: "materia-prima", label: "Materia Prima", icon: Package, href: "/gerencia/materia-prima" },
      { id: "guias", label: "Guías de Despacho", icon: FileText, href: "/gerencia/guia-despacho" },
    ],
  },
];

export function GerenciaSidebar({
  userRole,
  userName,
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
}: {
  userRole: string;
  userName: string;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const accentColor = "text-violet-400";
  const bgColor = "bg-violet-500";

  const handleLogout = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push("/auth/login");
  };

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev =>
      prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]
    );
  };

  const isActive = (href: string) => pathname === href || (href !== "/gerencia" && pathname.startsWith(href));

  const isGroupActive = (group: MenuGroup) => group.items.some(item => isActive(item.href));

  return (
    <>
    <AnimatePresence>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 88 : 288 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-[#0F172A] border-r border-slate-800 text-slate-300 hidden md:flex flex-col h-screen sticky top-0 shadow-2xl overflow-hidden shrink-0"
      >
        {/* Header */}
        <div className={`p-6 pt-8 flex items-center flex-shrink-0 relative ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
          <div className="absolute top-6 left-6 w-24 h-24 bg-violet-500/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className={`flex items-center gap-4 relative z-10 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="h-14 w-14 bg-gradient-to-br from-white to-slate-100 rounded-2xl flex items-center justify-center p-1.5 shadow-[0_0_20px_rgba(139,92,246,0.15)] border border-white/10 shrink-0">
              <Image src="/logo.jpeg" alt="PREALCA" width={56} height={56} style={{ width: '100%', height: '100%' }} className="object-contain drop-shadow-sm" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col justify-center whitespace-nowrap">
                <h2 className="font-black text-2xl tracking-[0.1em] bg-gradient-to-br from-white via-violet-50 to-violet-300 bg-clip-text text-transparent">PREALCA</h2>
                <p className="text-[9px] font-bold tracking-[0.3em] text-violet-400/80 uppercase mt-0.5">Panel de Control</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1 mt-6 overflow-y-auto overflow-x-hidden">
          {!isCollapsed && (
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 whitespace-nowrap">
              {userName}
            </p>
          )}

          {/* Top items: Alerta, Dashboard, Usuarios */}
          {topItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.id} href={item.href} title={isCollapsed ? item.label : ""}>
                <div className={`group flex items-center ${isCollapsed ? 'justify-center w-12 h-12 mx-auto px-0' : 'gap-3 px-4 py-2.5'} rounded-xl transition-all duration-200 relative ${
                  active ? `bg-white/5 ${accentColor} font-semibold` : "hover:bg-slate-800/50 hover:text-white"
                }`}>
                  {active && (
                    <motion.div layoutId="active-pill" className={`absolute left-0 w-1 h-6 ${bgColor} rounded-r-full shadow-[0_0_10px_rgba(139,92,246,0.5)]`} />
                  )}
                  <Icon size={18} className={`${active ? accentColor : "text-slate-400 group-hover:text-slate-300"} transition-colors shrink-0`} />
                  {!isCollapsed && <span className="text-sm whitespace-nowrap">{item.label}</span>}
                </div>
              </Link>
            );
          })}

          {/* Divider */}
          {!isCollapsed && (
            <div className="border-t border-slate-800 my-3" />
          )}

          {/* Collapsible groups */}
          {groups.map((group) => {
            const GroupIcon = group.icon;
            const groupOpen = openGroups.includes(group.id);
            const groupActive = isGroupActive(group);

            return (
              <div key={group.id}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  title={isCollapsed ? group.label : ""}
                  className={`w-full group flex items-center ${isCollapsed ? 'justify-center w-12 h-12 mx-auto px-0' : 'gap-3 px-4 py-2.5'} rounded-xl transition-all duration-200 relative ${
                    groupActive && !groupOpen ? `bg-white/5 ${accentColor} font-semibold` : "hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <GroupIcon size={18} className={`${groupActive ? accentColor : "text-slate-400 group-hover:text-slate-300"} transition-colors shrink-0`} />
                  {!isCollapsed && (
                    <>
                      <span className="text-sm whitespace-nowrap flex-1 text-left">{group.label}</span>
                      <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 shrink-0 ${groupOpen ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>

                {/* Group items */}
                <AnimatePresence>
                  {groupOpen && !isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 space-y-0.5 py-1">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const active = isActive(item.href);
                          return (
                            <Link key={item.id} href={item.href}>
                              <div className={`group flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 relative ${
                                active ? `bg-white/5 ${accentColor} font-semibold` : "hover:bg-slate-800/50 hover:text-white"
                              }`}>
                                {active && (
                                  <div className={`absolute left-0 w-1 h-5 ${bgColor} rounded-r-full shadow-[0_0_10px_rgba(139,92,246,0.5)]`} />
                                )}
                                <Icon size={15} className={`${active ? accentColor : "text-slate-500 group-hover:text-slate-300"} transition-colors shrink-0`} />
                                <span className="text-[13px] whitespace-nowrap">{item.label}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`p-4 bg-slate-900/50 border-t border-slate-800/50 mt-auto ${isCollapsed ? 'flex flex-col items-center gap-4' : ''}`}>
          <div className={`flex items-center gap-3 mb-2 ${isCollapsed ? 'justify-center px-0' : 'px-2 py-3'}`}>
            <div className={`h-10 w-10 rounded-xl ${bgColor} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
              <Eye size={18} />
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden whitespace-nowrap">
                <p className="text-sm font-bold text-white truncate">{userName}</p>
                <p className={`text-[10px] ${accentColor} uppercase font-bold tracking-wider`}>{userRole}</p>
              </div>
            )}
          </div>
          <button onClick={handleLogout} title={isCollapsed ? "Cerrar Sesión" : ""} className={`w-full flex items-center text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'}`}>
            <LogOut size={18} className="shrink-0" />
            {!isCollapsed && <span className="font-medium whitespace-nowrap">Cerrar Sesión</span>}
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>

    {/* Drawer mobile/tablet: el <aside> de arriba está "hidden" en ese ancho,
        así que abajo de md el botón hamburguesa no tenía nada que mostrar.
        Acá los grupos van siempre expandidos (sin acordeón): en un overlay de
        pantalla completa no hace falta ahorrar espacio vertical colapsándolos. */}
    <AnimatePresence>
      {isMobileOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 z-40 md:hidden"
            onClick={onCloseMobile}
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-[#0F172A] border-r border-slate-800 text-slate-300 flex flex-col shadow-2xl md:hidden"
          >
            <div className="p-6 pt-8 flex items-center justify-between flex-shrink-0 relative">
              <div className="absolute top-6 left-6 w-24 h-24 bg-violet-500/20 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="h-12 w-12 bg-gradient-to-br from-white to-slate-100 rounded-2xl flex items-center justify-center p-1.5 shrink-0">
                  <Image src="/logo.jpeg" alt="PREALCA" width={48} height={48} style={{ width: '100%', height: '100%' }} className="object-contain" />
                </div>
                <div className="flex flex-col justify-center whitespace-nowrap">
                  <h2 className="font-black text-xl tracking-[0.1em] text-white">PREALCA</h2>
                  <p className="text-[9px] font-bold tracking-[0.3em] text-violet-400/80 uppercase mt-0.5">Panel de Control</p>
                </div>
              </div>
              <button onClick={onCloseMobile} className="relative z-10 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" aria-label="Cerrar menú">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">{userName}</p>

              {topItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.id} href={item.href} onClick={onCloseMobile}>
                    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                      active ? `bg-white/5 ${accentColor} font-semibold` : "hover:bg-slate-800/50 hover:text-white"
                    }`}>
                      <Icon size={18} className={`${active ? accentColor : "text-slate-400"} shrink-0`} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  </Link>
                );
              })}

              <div className="border-t border-slate-800 my-3" />

              {groups.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <div key={group.id} className="mb-2">
                    <div className="flex items-center gap-3 px-4 py-2 text-slate-500">
                      <GroupIcon size={16} className="shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider">{group.label}</span>
                    </div>
                    <div className="pl-4 space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                          <Link key={item.id} href={item.href} onClick={onCloseMobile}>
                            <div className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                              active ? `bg-white/5 ${accentColor} font-semibold` : "hover:bg-slate-800/50 hover:text-white"
                            }`}>
                              <Icon size={15} className={`${active ? accentColor : "text-slate-500"} shrink-0`} />
                              <span className="text-[13px]">{item.label}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            <div className="p-4 bg-slate-900/50 border-t border-slate-800/50 mt-auto">
              <div className="flex items-center gap-3 mb-2 px-2 py-3">
                <div className={`h-10 w-10 rounded-xl ${bgColor} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                  <Eye size={18} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-white truncate">{userName}</p>
                  <p className={`text-[10px] ${accentColor} uppercase font-bold tracking-wider`}>{userRole}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all">
                <LogOut size={18} className="shrink-0" />
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
