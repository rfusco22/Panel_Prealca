"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, LayoutDashboard, Package, FileText, LogOut, Boxes } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dosificador" },
  { id: "alerta", label: "Alerta", icon: AlertTriangle, href: "/dosificador/alerta" },
  { id: "materia-prima", label: "Materia Prima", icon: Package, href: "/dosificador/materia-prima" },
  { id: "stock", label: "Inventario por Producto", icon: Boxes, href: "/dosificador/stock" },
  { id: "guias", label: "Guías de Despacho", icon: FileText, href: "/dosificador/guia-despacho" },
];

export function DosificadorSidebar({
  userRole,
  isCollapsed,
}: {
  userRole: string;
  isCollapsed: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const accentColor = "text-green-400";
  const bgColor = "bg-green-500";

  const handleLogout = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push("/auth/login");
  };

  return (
    <AnimatePresence>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 88 : 288 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-[#0F172A] border-r border-slate-800 text-slate-300 hidden md:flex flex-col h-screen sticky top-0 shadow-2xl overflow-hidden shrink-0"
      >
        <div className={`p-6 pt-8 flex items-center flex-shrink-0 relative ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
          <div className="absolute top-6 left-6 w-24 h-24 bg-green-500/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className={`flex items-center gap-4 relative z-10 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="h-14 w-14 bg-gradient-to-br from-white to-slate-100 rounded-2xl flex items-center justify-center p-1.5 shadow-[0_0_20px_rgba(34,197,94,0.15)] border border-white/10 shrink-0">
              <Image src="/logo.jpeg" alt="PREALCA" width={56} height={56} style={{ width: '100%', height: '100%' }} className="object-contain drop-shadow-sm" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col justify-center whitespace-nowrap">
                <h2 className="font-black text-2xl tracking-[0.1em] bg-gradient-to-br from-white via-green-50 to-green-300 bg-clip-text text-transparent">PREALCA</h2>
                <p className="text-[9px] font-bold tracking-[0.3em] text-green-400/80 uppercase mt-0.5">Panel de Control</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto overflow-x-hidden">
          {!isCollapsed && (
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 whitespace-nowrap">
              Menú Principal
            </p>
          )}
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dosificador" && pathname.startsWith(item.href));
            return (
              <Link key={item.id} href={item.href} title={isCollapsed ? item.label : ""}>
                <div className={`group flex items-center ${isCollapsed ? 'justify-center w-12 h-12 mx-auto px-0' : 'gap-3 px-4 py-3'} rounded-xl transition-all duration-200 relative ${
                  isActive ? `bg-white/5 ${accentColor} font-semibold` : "hover:bg-slate-800/50 hover:text-white"
                }`}>
                  {isActive && (
                    <motion.div layoutId="active-pill" className={`absolute left-0 w-1 h-6 ${bgColor} rounded-r-full shadow-[0_0_10px_rgba(34,197,94,0.5)]`} />
                  )}
                  <Icon size={20} className={`${isActive ? accentColor : "text-slate-400 group-hover:text-slate-300"} transition-colors shrink-0`} />
                  {!isCollapsed && <span className="text-sm whitespace-nowrap">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className={`p-4 bg-slate-900/50 border-t border-slate-800/50 mt-auto ${isCollapsed ? 'flex flex-col items-center gap-4' : ''}`}>
          <div className={`flex items-center gap-3 mb-2 ${isCollapsed ? 'justify-center px-0' : 'px-2 py-3'}`}>
            <div className={`h-10 w-10 rounded-xl ${bgColor} flex items-center justify-center text-sm font-bold text-white shrink-0`}>DZ</div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden whitespace-nowrap">
                <p className="text-sm font-bold text-white truncate">Dosificador</p>
                <p className={`text-[10px] ${accentColor} uppercase font-bold tracking-wider`}>Rol de Dosificador</p>
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
  );
}
