'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductoForm } from '@/components/forms/producto-form';

export default function NewProductoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // API call would go here
      router.push('/admin/productos');
    } catch (error) {
      console.error('[v0] Error creating producto:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProductoForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        title="Registrar Nuevo Producto"
      />
    </div>
  );
}
