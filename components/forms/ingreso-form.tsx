'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { calculateIVA, convertBolivaresToDollars, getExchangeRate } from '@/lib/currency';

const ingresoSchema = z.object({
  bancoId: z.coerce.number().min(1, 'Debe seleccionar un banco'),
  clienteId: z.coerce.number().min(1, 'Debe seleccionar un cliente'),
  vendedorId: z.coerce.number().optional(),
  descripcion: z.string().optional(),
  m3: z.coerce.number().min(0.01, 'Cantidad mínima 0.01').optional(),
  resistencia: z.string().optional(),
  precioBolivares: z.coerce.number().min(0, 'Precio debe ser positivo'),
  ivaAplicado: z.boolean().default(false),
  esAnticipo: z.boolean().default(false),
  referencia: z.string().optional(),
});

type IngresoFormData = z.infer<typeof ingresoSchema>;

interface IngresoFormProps {
  onSubmit: (data: IngresoFormData & { precioDolares: number; ivaMonto: number }) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<IngresoFormData>;
  title?: string;
  bancos?: Array<{ id: number; nombreBanco: string }>;
  clientes?: Array<{ id: number; nombre: string }>;
  vendedores?: Array<{ id: number; nombre: string }>;
}

export function IngresoForm({
  onSubmit,
  isLoading = false,
  initialData,
  title = 'Registrar Ingreso',
  bancos = [],
  clientes = [],
  vendedores = [],
}: IngresoFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(35.0);
  const [precioDolares, setPrecioDolares] = useState<number>(0);
  const [ivaMonto, setIvaMonto] = useState<number>(0);
  const [loadingRate, setLoadingRate] = useState(true);

  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm<IngresoFormData>({
    resolver: zodResolver(ingresoSchema),
    defaultValues: initialData,
  });

  const precioBolivares = watch('precioBolivares');
  const ivaAplicado = watch('ivaAplicado');

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

  // Calcular precio en dólares e IVA cuando cambia el precio en bolívares
  useEffect(() => {
    if (precioBolivares) {
      const dollars = precioBolivares / exchangeRate;
      setPrecioDolares(dollars);

      if (ivaAplicado) {
        const iva = calculateIVA(precioBolivares);
        setIvaMonto(iva);
      } else {
        setIvaMonto(0);
      }
    }
  }, [precioBolivares, ivaAplicado, exchangeRate]);

  const handleFormSubmit = async (data: IngresoFormData) => {
    setError(null);
    try {
      await onSubmit({
        ...data,
        precioDolares,
        ivaMonto,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar ingreso';
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
        {precioBolivares > 0 && (
          <p className="text-sm text-blue-900 mt-2">
            <strong>Conversión:</strong> {precioBolivares.toFixed(2)} Bs = ${precioDolares.toFixed(2)}
          </p>
        )}
        {ivaAplicado && ivaMonto > 0 && (
          <p className="text-sm text-blue-900 mt-2">
            <strong>IVA 16%:</strong> {ivaMonto.toFixed(2)} Bs
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
          <label htmlFor="vendedorId" className="block text-sm font-medium text-gray-700 mb-2">
            Vendedor
          </label>
          <select
            {...register('vendedorId')}
            id="vendedorId"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar vendedor...</option>
            {vendedores.map((vendedor) => (
              <option key={vendedor.id} value={vendedor.id}>
                {vendedor.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="referencia" className="block text-sm font-medium text-gray-700 mb-2">
            Referencia
          </label>
          <input
            {...register('referencia')}
            id="referencia"
            type="text"
            placeholder="Número de referencia o comprobante"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
          Descripción
        </label>
        <textarea
          {...register('descripcion')}
          id="descripcion"
          placeholder="Descripción del ingreso"
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="m3" className="block text-sm font-medium text-gray-700 mb-2">
            M³ (Cantidad)
          </label>
          <input
            {...register('m3')}
            id="m3"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="resistencia" className="block text-sm font-medium text-gray-700 mb-2">
            Resistencia
          </label>
          <input
            {...register('resistencia')}
            id="resistencia"
            type="text"
            placeholder="Ej: 40 MP"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="precioBolivares" className="block text-sm font-medium text-gray-700 mb-2">
            Precio en Bolívares *
          </label>
          <input
            {...register('precioBolivares')}
            id="precioBolivares"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.precioBolivares && <p className="text-red-500 text-sm mt-1">{errors.precioBolivares.message}</p>}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            {...register('ivaAplicado')}
            type="checkbox"
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">Aplicar IVA 16%</span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            {...register('esAnticipo')}
            type="checkbox"
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">Es Anticipo</span>
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
          disabled={isLoading || loadingRate}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? 'Guardando...' : 'Guardar Ingreso'}
        </Button>
      </div>
    </form>
  );
}
