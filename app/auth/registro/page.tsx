'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { RegisterForm } from '@/components/auth/register-form';

// Esta página crea usuarios (incluido el rol admin), así que solo pueden verla
// admin y gerencia. El control real está en POST /api/auth/crear_users; esto es
// solo para no mostrar el formulario a quien no corresponde.
const ROLES_PERMITIDOS = ['admin', 'gerencia'];

export default function RegistroPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const autorizado = !!session && ROLES_PERMITIDOS.includes(session.user.role);

  useEffect(() => {
    if (!loading && !autorizado) {
      router.replace('/auth/login');
    }
  }, [loading, autorizado, router]);

  if (loading || !autorizado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <span className="text-sm font-bold text-slate-500 animate-pulse">Verificando permisos...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl">
        <h1 className="text-2xl font-black uppercase mb-6">Crear Nuevo Usuario</h1>
        <RegisterForm />
      </div>
    </div>
  );
}
