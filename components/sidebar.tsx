"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Building2, Package, Truck, Receipt, Settings, PieChart, LogOut,
  LayoutDashboard, Users, TrendingUp, TrendingDown, Boxes, ShoppingCart,
  ArrowLeftRight, AlertTriangle, HardHat, UserCircle, FileText, ChevronDown,
  Wrench, X
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

const menuGroups: MenuGroup[] = [
  {
    id: "general",
    label: "General",
    icon: LayoutDashboard,
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
      { id: "alerta", label: "Alertas", icon: AlertTriangle, href: "/admin/alerta" },
      { id: "brecha", label: "Brecha Cambiaria", icon: ArrowLeftRight, href: "/admin/brecha-cambiaria" },
    ],
  },
  {
    id: "finanzas",
    label: "Finanzas",
    icon: TrendingUp,
    items: [
      { id: "ingresos", label: "Ingresos", icon: TrendingUp, href: "/admin/ingresos" },
      { id: "egresos", label: "Egresos", icon: TrendingDown, href: "/admin/egresos" },
      { id: "bancos", label: "Bancos", icon: Building2, href: "/admin/bancos" },
      { id: "retenciones", label: "Retenciones", icon: Receipt, href: "/admin/retenciones" },
      { id: "facturas", label: "Facturas", icon: FileText, href: "/admin/facturas" },
    ],
  },
  {
    id: "inventario",
    label: "Inventario",
    icon: Boxes,
    items: [
      { id: "productos", label: "Productos", icon: Package, href: "/admin/productos" },
      { id: "materia-prima", label: "Materia Prima", icon: Package, href: "/admin/materia-prima" },
      { id: "stock", label: "Stock por Producto", icon: Boxes, href: "/admin/stock" },
      { id: "agregados", label: "Agregados", icon: Settings, href: "/admin/agregados" },
    ],
  },
  {
    id: "ventas",
    label: "Ventas",
    icon: ShoppingCart,
    items: [
      { id: "pedidos", label: "Pedidos", icon: ShoppingCart, href: "/admin/pedidos" },
      { id: "clientes", label: "Clientes", icon: Users, href: "/admin/clientes" },
      { id: "vendedores", label: "Vendedores", icon: UserCircle, href: "/admin/vendedores" },
    ],
  },
  {
    id: "operaciones",
    label: "Operaciones",
    icon: Truck,
    items: [
      { id: "guias", label: "Guías de Despacho", icon: FileText, href: "/admin/guia-despacho" },
      { id: "choferes", label: "Choferes", icon: HardHat, href: "/admin/choferes" },
      { id: "unidades", label: "Unidades", icon: Truck, href: "/admin/unidades" },
      { id: "mantenimiento", label: "Mantenimiento", icon: Wrench, href: "/admin/mantenimiento-unidades" },
    ],
  },
  {
    id: "compras",
    label: "Compras",
    icon: ShoppingCart,
    items: [
      { id: "proveedores", label: "Proveedores", icon: Users, href: "/admin/proveedores" },
      { id: "ordenes", label: "Órdenes de Compra", icon: ShoppingCart, href: "/admin/ordenes-compra" },
    ],
  },
  {
    id: "sistema",
    label: "Sistema",
    icon: Settings,
    items: [
      { id: "reportes", label: "Reportes", icon: PieChart, href: "/admin/reportes" },
      { id: "usuarios", label: "Usuarios", icon: Users, href: "/admin/users" },
      { id: "settings", label: "Configuración", icon: Settings, href: "/admin/settings" },
    ],
  },
];

export function Sidebar({
  userRole,
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
}: {
  userRole: string;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [openGroups, setOpenGroups] = useState<string[]>(["general"]);

  const accentColor = "text-blue-400";
  const bgColor = "bg-blue-500";

  const toggleGroup = (groupId: string) => {
    if (isCollapsed) return;
    setOpenGroups((prev) =>
      prev.includes(groupId) ? prev.filter((g) => g !== groupId) : [...prev, groupId]
    );
  };

  const isGroupActive = (items: MenuItem[]) =>
    items.some((item) => pathname.startsWith(item.href) && (pathname === item.href || item.href !== "/admin"));

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

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
        <div className={`p-6 pt-8 flex items-center flex-shrink-0 relative ${isCollapsed ? "justify-center px-0" : "justify-between"}`}>
          <div className="absolute top-6 left-6 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className={`flex items-center gap-4 relative z-10 ${isCollapsed ? "justify-center" : ""}`}>
            <div className="h-14 w-14 bg-gradient-to-br from-white to-slate-100 rounded-2xl flex items-center justify-center p-1.5 shadow-[0_0_20px_rgba(59,130,246,0.15)] border border-white/10 shrink-0">
              <Image src="/logo.jpeg" alt="PREALCA" width={56} height={56} style={{ width: "100%", height: "100%" }} className="object-contain drop-shadow-sm" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col justify-center whitespace-nowrap">
                <h2 className="font-black text-2xl tracking-[0.1em] bg-gradient-to-br from-white via-blue-50 to-blue-300 bg-clip-text text-transparent">PREALCA</h2>
                <p className="text-[9px] font-bold tracking-[0.3em] text-blue-400/80 uppercase mt-0.5">Panel de Control</p>
              </div>
            )}
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 space-y-1 mt-6 overflow-y-auto overflow-x-hidden">
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 whitespace-nowrap">
              Menú Principal
            </p>
          )}

          {menuGroups.map((group) => {
            const GroupIcon = group.icon;
            const isOpen = openGroups.includes(group.id);
            const active = isGroupActive(group.items);

            if (isCollapsed) {
              const firstActiveItem = group.items.find(
                (item) => pathname.startsWith(item.href) && (pathname === item.href || item.href !== "/admin")
              );
              const ItemIcon = firstActiveItem?.icon || GroupIcon;
              const itemHref = firstActiveItem?.href || group.items[0].href;

              return (
                <Link key={group.id} href={itemHref} title={group.label}>
                  <div className={`group flex items-center justify-center w-12 h-12 mx-auto px-0 rounded-xl transition-all duration-200 relative ${
                    firstActiveItem ? `bg-white/5 ${accentColor} font-semibold` : "hover:bg-slate-800/50 hover:text-white"
                  }`}>
                    {firstActiveItem && (
                      <motion.div layoutId="active-pill" className={`absolute left-0 w-1 h-6 ${bgColor} rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]`} />
                    )}
                    <ItemIcon size={20} className={`${firstActiveItem ? accentColor : "text-slate-400 group-hover:text-slate-300"} transition-colors shrink-0`} />
                  </div>
                </Link>
              );
            }

            return (
              <div key={group.id} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left ${
                    active ? `bg-white/5 ${accentColor} font-semibold` : "hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <GroupIcon size={18} className={`${active ? accentColor : "text-slate-400"} transition-colors shrink-0`} />
                  <span className="text-sm flex-1 whitespace-nowrap">{group.label}</span>
                  <ChevronDown
                    size={14}
                    className={`text-slate-500 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 ml-5 border-l border-slate-700/50 space-y-0.5 py-1">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname.startsWith(item.href) && (pathname === item.href || item.href !== "/admin");

                          return (
                            <Link key={item.id} href={item.href}>
                              <div className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 relative ${
                                isActive ? `bg-white/5 ${accentColor} font-semibold` : "hover:bg-slate-800/50 hover:text-white"
                              }`}>
                                {isActive && (
                                  <motion.div layoutId="active-pill" className={`absolute -left-[17px] w-1 h-5 ${bgColor} rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.5)]`} />
                                )}
                                <Icon size={16} className={`${isActive ? accentColor : "text-slate-500 group-hover:text-slate-300"} transition-colors shrink-0`} />
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
        <div className={`p-4 bg-slate-900/50 border-t border-slate-800/50 mt-auto ${isCollapsed ? "flex flex-col items-center gap-4" : ""}`}>
          <div className={`flex items-center gap-3 mb-2 ${isCollapsed ? "justify-center px-0" : "px-2 py-3"}`}>
            <div className={`h-10 w-10 rounded-xl ${bgColor} flex items-center justify-center text-sm font-bold text-white shrink-0`}>AD</div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden whitespace-nowrap">
                <p className="text-sm font-bold text-white truncate">Admin Prealca</p>
                <p className={`text-[10px] ${accentColor} uppercase font-bold tracking-wider`}>Administrador</p>
              </div>
            )}
          </div>
          <button onClick={handleLogout} title={isCollapsed ? "Cerrar Sesión" : ""} className={`w-full flex items-center text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all ${isCollapsed ? "justify-center p-2.5" : "gap-3 px-4 py-2.5"}`}>
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
              <div className="absolute top-6 left-6 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="h-12 w-12 bg-gradient-to-br from-white to-slate-100 rounded-2xl flex items-center justify-center p-1.5 shrink-0">
                  <Image src="/logo.jpeg" alt="PREALCA" width={48} height={48} style={{ width: "100%", height: "100%" }} className="object-contain" />
                </div>
                <div className="flex flex-col justify-center whitespace-nowrap">
                  <h2 className="font-black text-xl tracking-[0.1em] text-white">PREALCA</h2>
                  <p className="text-[9px] font-bold tracking-[0.3em] text-blue-400/80 uppercase mt-0.5">Panel de Control</p>
                </div>
              </div>
              <button onClick={onCloseMobile} className="relative z-10 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" aria-label="Cerrar menú">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto">
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Menú Principal</p>

              {menuGroups.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <div key={group.id} className="mb-2">
                    <div className="flex items-center gap-3 px-3 py-2 text-slate-500">
                      <GroupIcon size={16} className="shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider">{group.label}</span>
                    </div>
                    <div className="pl-4 ml-5 border-l border-slate-700/50 space-y-0.5 py-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href) && (pathname === item.href || item.href !== "/admin");
                        return (
                          <Link key={item.id} href={item.href} onClick={onCloseMobile}>
                            <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                              isActive ? `bg-white/5 ${accentColor} font-semibold` : "hover:bg-slate-800/50 hover:text-white"
                            }`}>
                              <Icon size={16} className={`${isActive ? accentColor : "text-slate-500"} shrink-0`} />
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
                <div className={`h-10 w-10 rounded-xl ${bgColor} flex items-center justify-center text-sm font-bold text-white shrink-0`}>AD</div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-white truncate">Admin Prealca</p>
                  <p className={`text-[10px] ${accentColor} uppercase font-bold tracking-wider`}>Administrador</p>
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
