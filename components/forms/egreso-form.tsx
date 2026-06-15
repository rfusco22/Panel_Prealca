'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { getExchangeRate } from '@/lib/currency';

const egresoSchema = z.object({
  bancoId: z.coerce.number().min(1, 'Debe seleccionar un banco'),
  proveedorId: z.coerce.number().min(1, 'Debe seleccionar un proveedor'),
  clasificacionGasto: z.string().min(3, 'Debe seleccionar una clasificación'),
  tipoGasto: z.string().min(3, 'Debe seleccionar un tipo de gasto'),
  descripcion: z.string().optional(),
  montoBolivares: z.coerce.number().min(0, 'Monto debe ser positivo'),
  referencia: z.string().optional(),
});

type EgresoFormData = z.infer<typeof egresoSchema>;

interface EgresoFormProps {
  onSubmit: (data: EgresoFormData & { montoDolares: number }) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<EgresoFormData>;
  title?: string;
  bancos?: Array<{ id: number; nombreBanco: string }>;
  proveedores?: Array<{ id: number; nombre: string }>;
}

const CLASIFICACIONES = [
  'Mantenimiento',
  'Producción',
  'Administración',
  'Venta',
  'Investigación',
  'Operativo',
];

const TIPOS_GASTO: Record<string, string[]> = {
  Mantenimiento: ['Reparaciones', 'Lubricantes', 'Piezas', 'Servicios'],
  Producción: ['Materia Prima', 'Combustible', 'Electricidad', 'Agua'],
  Administración: ['Salarios', 'Servicios', 'Suministros', 'Seguros'],
  Venta: ['Transporte', 'Publicidad', 'Comisiones', 'Descuentos'],
  Investigación: ['Análisis', 'Pruebas', 'Consultoría', 'Software'],
  Operativo: ['Combustible', 'Mantenimiento', 'Repuestos', 'Otros'],
};

export function EgresoForm({
  onSubmit,
  isLoading = false,
  initialData,
  title = 'Registrar Egreso',
  bancos = [],
  proveedores = [],
}: EgresoFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(35.0);
  const [montoDolares, setMontoDolares] = useState<number>(0);
  const [loadingRate, setLoadingRate] = useState(true);
  const [tiposDisponibles, setTiposDisponibles] = useState<string[]>([]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<EgresoFormData>({
    resolver: zodResolver(egresoSchema),
    defaultValues: initialData,
  });

  const montoBolivares = watch('montoBolivares');
  const clasificacionGasto = watch('clasificacionGasto');

  // Obtener tasa de cambio al montar
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const rate = await getExchangeRate();
        setExchangeRate(rate);
      } catch (err) {
        console.error('[v0] Error fetching exchange rate:', err);
      } finally {
        setLoadingRate(false);
      }
    };
    fetchRate();
  }, []);

  // Actualizar tipos disponibles cuando cambia la clasificación
  useEffect(() => {
    if (clasificacionGasto && TIPOS_GASTO[clasificacionGasto]) {
      setTiposDisponibles(TIPOS_GASTO[clasificacionGasto]);
    }
  }, [clasificacionGasto]);

  // Calcular monto en dólares cuando cambia el monto en bolívares
  useEffect(() => {
    if (montoBolivares) {
      const dollars = montoBolivares / exchangeRate;
      setMontoDolares(dollars);
    }
  }, [montoBolivares, exchangeRate]);

  const handleFormSubmit = async (data: EgresoFormData) => {
    setError(null);
    try {
      await onSubmit({
        ...data,
        montoDolares,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar egreso';
      setError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>

      {error && <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">{error}</div>}

      {loadingRate && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded">
          Cargando tasa de cambio...
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Tasa de Cambio Actual:</strong> 1 USD = {exchangeRate.toFixed(2)} Bs
        </p>
        {montoBolivares > 0 && (
          <p className="text-sm text-blue-900 mt-2">
            <strong>Conversión:</strong> {montoBolivares.toFixed(2)} Bs = ${montoDolares.toFixed(2)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="bancoId" className="block text-sm font-medium text-gray-700 mb-2">
            Banco *
          </label>
          <select
            {...register('bancoId')}
            id="bancoId"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar banco...</option>
            {bancos.map((banco) => (
              <option key={banco.id} value={banco.id}>
                {banco.nombreBanco}
              </option>
            ))}
          </select>
          {errors.bancoId && <p className="text-red-500 text-sm mt-1">{errors.bancoId.message}</p>}
        </div>

        <div>
          <label htmlFor="proveedorId" className="block text-sm font-medium text-gray-700 mb-2">
            Proveedor *
          </label>
          <select
            {...register('proveedorId')}
            id="proveedorId"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar proveedor...</option>
            {proveedores.map((proveedor) => (
              <option key={proveedor.id} value={proveedor.id}>
                {proveedor.nombre}
              </option>
            ))}
          </select>
          {errors.proveedorId && <p className="text-red-500 text-sm mt-1">{errors.proveedorId.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="clasificacionGasto" className="block text-sm font-medium text-gray-700 mb-2">
            Clasificación de Gasto *
          </label>
          <select
            {...register('clasificacionGasto')}
            id="clasificacionGasto"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar clasificación...</option>
            {CLASIFICACIONES.map((clasificacion) => (
              <option key={clasificacion} value={clasificacion}>
                {clasificacion}
              </option>
            ))}
          </select>
          {errors.clasificacionGasto && (
            <p className="text-red-500 text-sm mt-1">{errors.clasificacionGasto.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="tipoGasto" className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Gasto *
          </label>
          <select
            {...register('tipoGasto')}
            id="tipoGasto"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!clasificacionGasto}
          >
            <option value="">Seleccionar tipo...</option>
            {tiposDisponibles.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
          {errors.tipoGasto && <p className="text-red-500 text-sm mt-1">{errors.tipoGasto.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="referencia" className="block text-sm font-medium text-gray-700 mb-2">
            Referencia / Comprobante
          </label>
          <input
            {...register('referencia')}
            id="referencia"
            type="text"
            placeholder="Número de comprobante o referencia"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="montoBolivares" className="block text-sm font-medium text-gray-700 mb-2">
            Monto en Bolívares *
          </label>
          <input
            {...register('montoBolivares')}
            id="montoBolivares"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.montoBolivares && <p className="text-red-500 text-sm mt-1">{errors.montoBolivares.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
          Descripción
        </label>
        <textarea
          {...register('descripcion')}
          id="descripcion"
          placeholder="Descripción del gasto"
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
          disabled={isLoading || loadingRate}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? 'Guardando...' : 'Guardar Egreso'}
        </Button>
      </div>
    </form>
  );
}
