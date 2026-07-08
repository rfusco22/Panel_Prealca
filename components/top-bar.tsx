"use client";

import { motion } from "framer-motion";
import { LogOut, Menu, Globe, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface TopBarProps {
  userRole?: string;
  isCollapsed?: boolean;
  onToggleSidebar: () => void;
}

export function TopBar({ userRole = 'admin', onToggleSidebar }: TopBarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    // Lógica actual de PREALCA para destruir la sesión
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push("/auth/login");
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm sticky top-0 z-40">
      
      {/* Lado Izquierdo */}
      <div className="flex items-center gap-4">
        {/* Botón de Menú (Hamburger) */}
        <motion.button
          onClick={onToggleSidebar}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <Menu size={24} className="text-gray-700" />
        </motion.button>

        {/* Logo PREALCA */}
        <div className="flex items-center gap-3">
          <Image
            src="/logo.jpeg" // Asegúrate de que coincida con tu imagen en la carpeta public
            alt="PREALCA"
            width={32}
            height={32}
            className="h-8 w-auto object-contain"
          />
          {/* Si quieres que diga PREALCA al lado del logo, descomenta la siguiente línea */}
          {/* <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:block">PREALCA</span> */}
        </div>
      </div>

      {/* Lado Derecho */}
      <div className="flex items-center gap-6">
        
        {/* Selector de Idioma (Visualmente idéntico al de Supricom) */}
        <div className="hidden sm:flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
          <Globe size={18} className="text-gray-600" />
          <span>Español</span>
          <ChevronDown size={16} className="text-gray-400" />
        </div>

        {/* Info de Usuario y Logout */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm text-gray-500 capitalize font-medium">
              {userRole === 'admin' ? 'Administrador' : userRole}
            </p>
          </div>

          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Cerrar Sesión"
          >
            <LogOut size={22} />
          </motion.button>
        </div>
      </div>
      
    </div>
  );
}