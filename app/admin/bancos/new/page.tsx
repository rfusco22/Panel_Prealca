'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BancoForm } from '@/components/forms/banco-form';

export default function NewBancoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // API call would go here
      router.push('/admin/bancos');
    } catch (error) {
      console.error('[v0] Error creating banco:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <BancoForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        title="Registrar Nueva Cuenta Bancaria"
      />
    </div>
  );
}
