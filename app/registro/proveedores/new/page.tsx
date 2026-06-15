'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProveedorForm } from '@/components/forms/proveedor-form';

export default function NewProveedorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // Aquí iría la llamada a la API para crear el proveedor
      // const response = await fetch('/api/proveedores', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      // if (!response.ok) throw new Error('Error al crear proveedor');

      // Por ahora, solo redirigir
      router.push('/registro/proveedores');
    } catch (error) {
      console.error('[v0] Error creating proveedor:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProveedorForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        title="Crear Nuevo Proveedor"
      />
    </div>
  );
}
