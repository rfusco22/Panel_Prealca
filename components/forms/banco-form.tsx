'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';

const bancoSchema = z.object({
  nombreBanco: z.string().min(3, 'El nombre del banco debe tener al menos 3 caracteres'),
  numeroCuenta: z.string().min(8, 'El número de cuenta debe ser válido').max(50),
  titularCuenta: z.string().min(3, 'El titular debe tener al menos 3 caracteres'),
  cedula: z.string().optional(),
});

type BancoFormData = z.infer<typeof bancoSchema>;

interface BancoFormProps {
  onSubmit: (data: BancoFormData) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<BancoFormData>;
  title?: string;
}

export function BancoForm({
  onSubmit,
  isLoading = false,
  initialData,
  title = 'Nueva Cuenta Bancaria',
}: BancoFormProps) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<BancoFormData>({
    resolver: zodResolver(bancoSchema),
    defaultValues: initialData,
  });

  const handleFormSubmit = async (data: BancoFormData) => {
    setError(null);
    try {
      await onSubmit(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar cuenta bancaria';
      setError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>

      {error && <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="nombreBanco" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Banco *
          </label>
          <input
            {...register('nombreBanco')}
            id="nombreBanco"
            type="text"
            placeholder="Ej: Banco de Venezuela"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.nombreBanco && <p className="text-red-500 text-sm mt-1">{errors.nombreBanco.message}</p>}
        </div>

        <div>
          <label htmlFor="numeroCuenta" className="block text-sm font-medium text-gray-700 mb-2">
            Número de Cuenta *
          </label>
          <input
            {...register('numeroCuenta')}
            id="numeroCuenta"
            type="text"
            placeholder="0102-0000-0000-0000-0000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.numeroCuenta && <p className="text-red-500 text-sm mt-1">{errors.numeroCuenta.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="titularCuenta" className="block text-sm font-medium text-gray-700 mb-2">
            Titular de la Cuenta *
          </label>
          <input
            {...register('titularCuenta')}
            id="titularCuenta"
            type="text"
            placeholder="Nombre del titular"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.titularCuenta && <p className="text-red-500 text-sm mt-1">{errors.titularCuenta.message}</p>}
        </div>

        <div>
          <label htmlFor="cedula" className="block text-sm font-medium text-gray-700 mb-2">
            Cédula del Titular
          </label>
          <input
            {...register('cedula')}
            id="cedula"
            type="text"
            placeholder="V-12345678"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          className="bg-gray-300 hover:bg-gray-400 text-gray-900"
          onClick={() => window.history.back()}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
