'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { Navbar } from '@/components/layout/navbar';

export default function RegistroLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { session, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (!session || (session.user.role !== 'registro' && session.user.role !== 'admin')) {
    if (!loading) {
      router.push('/login');
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
