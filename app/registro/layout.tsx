'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { RegistroSidebar } from '@/components/registro-sidebar';
import { TopBar } from '@/components/top-bar';

export default function RegistroLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  // El boton hamburguesa del TopBar hace dos cosas distintas segun el ancho:
  // en desktop colapsa el sidebar a un riel de iconos, en mobile/tablet abre un
  // drawer superpuesto (el sidebar de escritorio esta con "hidden" ahi, nunca
  // se veia). Se togglean los dos juntos: cada pantalla solo muestra el que le
  // corresponde via CSS, asi que no hace falta detectar el viewport en JS.
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!session || session.user.role !== 'registro') {
        router.push('/auth/login');
      }
    }
  }, [session, loading, router]);

  if (loading || !session || session.user.role !== 'registro') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <span className="text-sm font-bold text-zinc-500 animate-pulse">Cargando panel...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans" style={{ colorScheme: 'light' }}>
      <RegistroSidebar userRole={session.user.role} isCollapsed={isCollapsed} isMobileOpen={isMobileOpen} onCloseMobile={() => setIsMobileOpen(false)} />
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
