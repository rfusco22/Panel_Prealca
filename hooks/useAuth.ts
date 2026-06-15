'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  nombre: string;
  role: 'admin' | 'registro' | 'documentador';
  estado: string;
}

export interface Session {
  user: User;
  token: string;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (!response.ok) {
          setSession(null);
          setLoading(false);
          return;
        }
        const data = await response.json();
        setSession(data);
      } catch (err) {
        console.error('[v0] Error checking auth:', err);
        setError('Error verificando autenticación');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setSession(null);
      router.push('/login');
    } catch (err) {
      console.error('[v0] Error logging out:', err);
      setError('Error al cerrar sesión');
    }
  };

  return { session, loading, error, logout };
}
