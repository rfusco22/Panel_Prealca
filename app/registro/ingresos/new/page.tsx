'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IngresoForm } from '@/components/forms/ingreso-form';

// Mock data - en la implementación real, vendría de la API
const mockBancos = [
  { id: 1, nombreBanco: 'Banco de Venezuela' },
  { id: 2, nombreBanco: 'Banesco' },
  { id: 3, nombreBanco: 'BOD' },
];

const mockClientes = [
  { id: 1, nombre: 'Empresa A' },
  { id: 2, nombre: 'Empresa B' },
  { id: 3, nombre: 'Cliente C' },
];

const mockVendedores = [
  { id: 1, nombre: 'Juan Pérez' },
  { id: 2, nombre: 'María García' },
  { id: 3, nombre: 'Carlos López' },
];

export default function NewIngresoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // API call would go here
      // await fetch('/api/ingresos', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });

      console.log('[v0] Ingreso data:', data);
      router.push('/registro/ingresos');
    } catch (error) {
      console.error('[v0] Error creating ingreso:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <IngresoForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        title="Registrar Nuevo Ingreso"
        bancos={mockBancos}
        clientes={mockClientes}
        vendedores={mockVendedores}
      />
    </div>
  );
}
