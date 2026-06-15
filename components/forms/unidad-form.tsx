'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';

const unidadSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  tipo: z.string().min(3, 'El tipo debe tener al menos 3 caracteres'),
  placa: z.string().optional(),
});

type UnidadFormData = z.infer<typeof unidadSchema>;

interface UnidadFormProps {
  onSubmit: (data: UnidadFormData) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<UnidadFormData>;
  title?: string;
}

export function UnidadForm({
  onSubmit,
  isLoading = false,
  initialData,
  title = 'Nueva Unidad',
}: UnidadFormProps) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<UnidadFormData>({
    resolver: zodResolver(unidadSchema),
    defaultValues: initialData,
  });

  const handleFormSubmit = async (data: UnidadFormData) => {
    setError(null);
    try {
      await onSubmit(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar unidad';
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
            Nombre de la Unidad *
          </label>
          <input
            {...register('nombre')}
            id="nombre"
            type="text"
            placeholder="Ej: Camión 1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
        </div>

        <div>
          <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Unidad *
          </label>
          <select
            {...register('tipo')}
            id="tipo"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar tipo...</option>
            <option value="Camión">Camión</option>
            <option value="Volqueta">Volqueta</option>
            <option value="Furgón">Furgón</option>
            <option value="Trailer">Trailer</option>
            <option value="Otro">Otro</option>
          </select>
          {errors.tipo && <p className="text-red-500 text-sm mt-1">{errors.tipo.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="placa" className="block text-sm font-medium text-gray-700 mb-2">
          Placa (Número de Registro)
        </label>
        <input
          {...register('placa')}
          id="placa"
          type="text"
          placeholder="Ej: AA-123456"
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
