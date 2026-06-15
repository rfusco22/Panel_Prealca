'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';

const proveedorSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  rif: z.string().min(6, 'El RIF debe tener al menos 6 caracteres').unique('RIF ya existe'),
  direccion: z.string().optional(),
  clasificacionGasto: z.string().optional(),
  esContribuyenteEspecial: z.boolean().default(false),
});

type ProveedorFormData = z.infer<typeof proveedorSchema>;

interface ProveedorFormProps {
  onSubmit: (data: ProveedorFormData) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<ProveedorFormData>;
  title?: string;
}

export function ProveedorForm({
  onSubmit,
  isLoading = false,
  initialData,
  title = 'Nuevo Proveedor',
}: ProveedorFormProps) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<ProveedorFormData>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: initialData,
  });

  const handleFormSubmit = async (data: ProveedorFormData) => {
    setError(null);
    try {
      await onSubmit(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar proveedor';
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
            placeholder="Nombre del proveedor"
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
          placeholder="Dirección del proveedor"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="clasificacionGasto" className="block text-sm font-medium text-gray-700 mb-2">
            Clasificación de Gasto
          </label>
          <select
            {...register('clasificacionGasto')}
            id="clasificacionGasto"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar...</option>
            <option value="Mantenimiento">Mantenimiento</option>
            <option value="Producción">Producción</option>
            <option value="Administración">Administración</option>
            <option value="Venta">Venta</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              {...register('esContribuyenteEspecial')}
              type="checkbox"
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">Contribuyente Especial</span>
          </label>
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
