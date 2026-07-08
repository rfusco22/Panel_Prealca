import { ReactNode } from 'react';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar'; // Importamos el TopBar
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const userRole = session.role || 'Usuario';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Sidebar Fijo a la izquierda */}
      <Sidebar userRole={userRole} />

      {/* Contenedor Principal (Lado Derecho) */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Top Bar fijado en la parte superior del contenido */}
        <TopBar userRole={userRole} />

        {/* Área scrolleable donde van las páginas (Dashboard, Config, etc.) */}
        <main className="flex-1 overflow-y-auto relative">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}