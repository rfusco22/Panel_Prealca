'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { session, logout } = useAuth();
  const router = useRouter();

  if (!session) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-blue-600">PREALCA</h1>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full uppercase">
              {session.user.role}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{session.user.nombre}</p>
              <p className="text-xs text-gray-500">{session.user.email}</p>
            </div>
            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
