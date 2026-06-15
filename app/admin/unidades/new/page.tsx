'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UnidadForm } from '@/components/forms/unidad-form';

export default function NewUnidadPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // API call would go here
      router.push('/admin/unidades');
    } catch (error) {
      console.error('[v0] Error creating unidad:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <UnidadForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        title="Registrar Nueva Unidad de Transporte"
      />
    </div>
  );
}
