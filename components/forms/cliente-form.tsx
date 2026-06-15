'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';

const clienteSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  rif: z.string().min(6, 'El RIF debe tener al menos 6 caracteres'),
  direccion: z.string().optional(),
  esContribuyenteEspecial: z.boolean().default(false),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

interface ClienteFormProps {
  onSubmit: (data: ClienteFormData) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<ClienteFormData>;
  title?: string;
}

export function ClienteForm({
  onSubmit,
  isLoading = false,
  initialData,
  title = 'Nuevo Cliente',
}: ClienteFormProps) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: initialData,
  });

  const handleFormSubmit = async (data: ClienteFormData) => {
    setError(null);
    try {
      await onSubmit(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar cliente';
      setError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>

      {error && <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre *
          </label>
          <input
            {...register('nombre')}
            id="nombre"
            type="text"
            placeholder="Nombre del cliente"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
        </div>

        <div>
          <label htmlFor="rif" className="block text-sm font-medium text-gray-700 mb-2">
            RIF *
          </label>
          <input
            {...register('rif')}
            id="rif"
            type="text"
            placeholder="V-12345678 o J-12345678"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.rif && <p className="text-red-500 text-sm mt-1">{errors.rif.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
          Dirección
        </label>
        <textarea
          {...register('direccion')}
          id="direccion"
          placeholder="Dirección del cliente"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-end">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            {...register('esContribuyenteEspecial')}
            type="checkbox"
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">Contribuyente Especial (aplica retención IVA)</span>
        </label>
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
