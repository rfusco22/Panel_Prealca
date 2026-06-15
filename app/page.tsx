'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir a login
    router.push('/login');
  }, [router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <p className="text-gray-600">Redirigiendo...</p>
    </main>
  );
}
