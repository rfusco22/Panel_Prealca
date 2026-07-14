'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// AGREGAR ESTA LÍNEA (Ajusta la ruta si tu @ no apunta a la raíz, o usa '../hooks/useAuth')
import { useAuth } from '@/hooks/useAuth'; 

export default function RegistroLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  const { session, loading } = useAuth();

  useEffect(() => {
    // Solo actuamos cuando ya terminó de cargar
    if (!loading) {
      // Verificamos si no hay sesión o si el rol no es válido
      if (!session || (session.user.role !== 'registro' && session.user.role !== 'admin')) {
        router.push('/auth/login'); // Redirección correcta a la pantalla de login
      }
    }
  }, [session, loading, router]); 

  // Mientras carga o si estamos a punto de redirigir, mostramos nada (o un spinner)
  if (loading || !session || (session.user.role !== 'registro' && session.user.role !== 'admin')) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <span className="text-sm font-bold text-zinc-500 animate-pulse">Cargando panel...</span>
      </div>
    ); 
  }

  // Si pasa las validaciones, renderiza el contenido del panel (sidebar, topbar, etc.)
  return (
    <>
      {children}
    </>
  );
}