'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { calculateIVA } from '@/lib/currency';

const guiaSchema = z.object({
  tipo: z.enum(['Prealca', 'Premezclado'], { message: 'Selecciona un tipo válido' }),
  clienteId: z.coerce.number().min(1, 'Debe seleccionar un cliente'),
  productoId: z.coerce.number().min(1, 'Debe seleccionar un producto'),
  cantidadM3: z.coerce.number().min(0.01, 'Cantidad mínima 0.01 m³'),
  precioM3: z.coerce.number().min(0, 'Precio debe ser positivo'),
  ivaAplicado: z.boolean().default(false),
  chofer: z.string().min(3, 'Nombre del chofer requerido'),
  unidadId: z.coerce.number().optional(),
});

type GuiaFormData = z.infer<typeof guiaSchema>;

interface GuiaDespachoFormProps {
  onSubmit: (data: GuiaFormData & { total: number; ivaMonto: number }) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<GuiaFormData>;
  title?: string;
  clientes?: Array<{ id: number; nombre: string }>;
  productos?: Array<{ id: number; nombre: string; resistencia?: string }>;
  unidades?: Array<{ id: number; nombre: string; tipo: string }>;
}

export function GuiaDespachoForm({
  onSubmit,
  isLoading = false,
  initialData,
  title = 'Nueva Guía de Despacho',
  clientes = [],
  productos = [],
  unidades = [],
}: GuiaDespachoFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [ivaMonto, setIvaMonto] = useState<number>(0);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<GuiaFormData>({
    resolver: zodResolver(guiaSchema),
    defaultValues: initialData,
  });

  const cantidadM3 = watch('cantidadM3');
  const precioM3 = watch('precioM3');
  const ivaAplicado = watch('ivaAplicado');

  // Calcular total e IVA cuando cambian los valores
  useEffect(() => {
    if (cantidadM3 && precioM3) {
      const subtotal = cantidadM3 * precioM3;
      
      if (ivaAplicado) {
        const iva = calculateIVA(subtotal);
        setIvaMonto(iva);
        setTotal(subtotal + iva);
      } else {
        setIvaMonto(0);
        setTotal(subtotal);
      }
    }
  }, [cantidadM3, precioM3, ivaAplicado]);

  const handleFormSubmit = async (data: GuiaFormData) => {
    setError(null);
    try {
      await onSubmit({
        ...data,
        total,
        ivaMonto,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar guía';
      setError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>

      {error && <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">{error}</div>}

      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-green-900 font-medium">
          <strong>Total:</strong> {total.toFixed(2)} Bs
        </p>
        {ivaAplicado && (
          <p className="text-sm text-green-900 mt-2">
            <strong>Subtotal:</strong> {((total - ivaMonto) || 0).toFixed(2)} Bs + <strong>IVA 16%:</strong> {ivaMonto.toFixed(2)} Bs
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Guía *
          </label>
          <select
            {...register('tipo')}
            id="tipo"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar tipo...</option>
            <option value="Prealca">Prealca</option>
            <option value="Premezclado">Premezclado</option>
          </select>
          {errors.tipo && <p className="text-red-500 text-sm mt-1">{errors.tipo.message}</p>}
        </div>

        <div>
          <label htmlFor="clienteId" className="block text-sm font-medium text-gray-700 mb-2">
            Cliente *
          </label>
          <select
            {...register('clienteId')}
            id="clienteId"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar cliente...</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </select>
          {errors.clienteId && <p className="text-red-500 text-sm mt-1">{errors.clienteId.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="productoId" className="block text-sm font-medium text-gray-700 mb-2">
            Producto *
          </label>
          <select
            {...register('productoId')}
            id="productoId"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar producto...</option>
            {productos.map((producto) => (
              <option key={producto.id} value={producto.id}>
                {producto.nombre} {producto.resistencia && `(${producto.resistencia})`}
              </option>
            ))}
          </select>
          {errors.productoId && <p className="text-red-500 text-sm mt-1">{errors.productoId.message}</p>}
        </div>

        <div>
          <label htmlFor="unidadId" className="block text-sm font-medium text-gray-700 mb-2">
            Unidad de Transporte
          </label>
          <select
            {...register('unidadId')}
            id="unidadId"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar unidad...</option>
            {unidades.map((unidad) => (
              <option key={unidad.id} value={unidad.id}>
                {unidad.nombre} ({unidad.tipo})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="cantidadM3" className="block text-sm font-medium text-gray-700 mb-2">
            Cantidad (M³) *
          </label>
          <input
            {...register('cantidadM3')}
            id="cantidadM3"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.cantidadM3 && <p className="text-red-500 text-sm mt-1">{errors.cantidadM3.message}</p>}
        </div>

        <div>
          <label htmlFor="precioM3" className="block text-sm font-medium text-gray-700 mb-2">
            Precio por M³ (Bs) *
          </label>
          <input
            {...register('precioM3')}
            id="precioM3"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.precioM3 && <p className="text-red-500 text-sm mt-1">{errors.precioM3.message}</p>}
        </div>

        <div>
          <label htmlFor="chofer" className="block text-sm font-medium text-gray-700 mb-2">
            Chofer/Operario *
          </label>
          <input
            {...register('chofer')}
            id="chofer"
            type="text"
            placeholder="Nombre del chofer"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.chofer && <p className="text-red-500 text-sm mt-1">{errors.chofer.message}</p>}
        </div>
      </div>

      <div className="flex items-center">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            {...register('ivaAplicado')}
            type="checkbox"
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">Aplicar IVA 16%</span>
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
          {isLoading ? 'Guardando...' : 'Guardar Guía de Despacho'}
        </Button>
      </div>
    </form>
  );
}
