'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';

const productoSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  resistencia: z.string().optional(),
  descripcion: z.string().optional(),
});

type ProductoFormData = z.infer<typeof productoSchema>;

interface ProductoFormProps {
  onSubmit: (data: ProductoFormData) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<ProductoFormData>;
  title?: string;
}

export function ProductoForm({
  onSubmit,
  isLoading = false,
  initialData,
  title = 'Nuevo Producto',
}: ProductoFormProps) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<ProductoFormData>({
    resolver: zodResolver(productoSchema),
    defaultValues: initialData,
  });

  const handleFormSubmit = async (data: ProductoFormData) => {
    setError(null);
    try {
      await onSubmit(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar producto';
      setError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>

      {error && <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">{error}</div>}

      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
          Nombre del Producto *
        </label>
        <input
          {...register('nombre')}
          id="nombre"
          type="text"
          placeholder="Ej: Cemento Prealca"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
      </div>

      <div>
        <label htmlFor="resistencia" className="block text-sm font-medium text-gray-700 mb-2">
          Resistencia (Ej: 40 MP)
        </label>
        <input
          {...register('resistencia')}
          id="resistencia"
          type="text"
          placeholder="Resistencia del producto"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
          Descripción
        </label>
        <textarea
          {...register('descripcion')}
          id="descripcion"
          placeholder="Descripción del producto"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
