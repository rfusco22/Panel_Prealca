'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { SeguridadVialSidebar } from '@/components/seguridad-vial-sidebar';
import { TopBar } from '@/components/top-bar';

export default function SeguridadVialLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  // El boton hamburguesa del TopBar hace dos cosas distintas segun el ancho:
  // en desktop colapsa el sidebar a un riel de iconos, en mobile/tablet abre un
  // drawer superpuesto (el sidebar de escritorio esta con "hidden" ahi, nunca
  // se veia). Se togglean los dos juntos: cada pantalla solo muestra el que le
  // corresponde via CSS, asi que no hace falta detectar el viewport en JS.
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-500">Cargando...</p>
      </div>
    );
  }

  if (!session || session.user.role !== 'seguridad-vial') {
    if (!loading) {
      router.push('/auth/login');
    }
    return null;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans" style={{ colorScheme: 'light' }}>
      <SeguridadVialSidebar userRole={session.user.role} isCollapsed={isCollapsed} isMobileOpen={isMobileOpen} onCloseMobile={() => setIsMobileOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <TopBar userRole={session.user.role} isCollapsed={isCollapsed} onToggleSidebar={() => { setIsCollapsed(c => !c); setIsMobileOpen(o => !o); }} />
        <main className="flex-1 overflow-y-auto relative">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
