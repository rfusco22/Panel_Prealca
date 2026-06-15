'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClienteForm } from '@/components/forms/cliente-form';

export default function NewClientePage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // API call would go here
      router.push('/registro/clientes');
    } catch (error) {
      console.error('[v0] Error creating cliente:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ClienteForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        title="Crear Nuevo Cliente"
      />
    </div>
  );
}
