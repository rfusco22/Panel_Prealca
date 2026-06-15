'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EgresoForm } from '@/components/forms/egreso-form';

const mockBancos = [
  { id: 1, nombreBanco: 'Banco de Venezuela' },
  { id: 2, nombreBanco: 'Banesco' },
  { id: 3, nombreBanco: 'BOD' },
];

const mockProveedores = [
  { id: 1, nombre: 'Proveedor A' },
  { id: 2, nombre: 'Proveedor B' },
  { id: 3, nombre: 'Proveedor C' },
];

export default function NewEgresoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      console.log('[v0] Egreso data:', data);
      router.push('/registro/egresos');
    } catch (error) {
      console.error('[v0] Error creating egreso:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <EgresoForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        title="Registrar Nuevo Egreso"
        bancos={mockBancos}
        proveedores={mockProveedores}
      />
    </div>
  );
}
