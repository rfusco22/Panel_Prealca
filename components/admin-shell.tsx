"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export function AdminShell({ 
  children, 
  userRole 
}: { 
  children: React.ReactNode; 
  userRole: string;
}) {
  // Estado que controla si el sidebar está contraído o no
  const [isCollapsed, setIsCollapsed] = useState(false);
  // En mobile/tablet el sidebar de escritorio está oculto (hidden md:flex);
  // este estado controla el drawer superpuesto que lo reemplaza ahí.
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">

      {/* Le pasamos el estado al Sidebar para que se encoja */}
      <Sidebar userRole={userRole} isCollapsed={isCollapsed} isMobileOpen={isMobileOpen} onCloseMobile={() => setIsMobileOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Le pasamos el estado y la función para cambiarlo al TopBar */}
        <TopBar
          userRole={userRole}
          isCollapsed={isCollapsed}
          onToggleSidebar={() => { setIsCollapsed(c => !c); setIsMobileOpen(o => !o); }}
        />

        <main className="flex-1 overflow-y-auto relative">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
            {children}
          </div>
        </main>
      </div>
      
    </div>
  );
}