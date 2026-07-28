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

  useEffect(() => {
    if (!loading) {
      if (!session || (session.user.role !== 'registro' && session.user.role !== 'admin')) {
        router.push('/auth/login');
      }
    }
  }, [session, loading, router]);

  if (loading || !session || (session.user.role !== 'registro' && session.user.role !== 'admin')) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <span className="text-sm font-bold text-zinc-500 animate-pulse">Cargando panel...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <RegistroSidebar userRole={session.user.role} isCollapsed={isCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <TopBar userRole={session.user.role} isCollapsed={isCollapsed} onToggleSidebar={() => setIsCollapsed(!isCollapsed)} />
        <main className="flex-1 overflow-y-auto relative">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
