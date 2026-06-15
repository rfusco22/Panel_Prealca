'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { convertCurrency } from '@/lib/currency';
import axios from 'axios';

const facturaSchema = z.object({
  tipoFactura: z.enum(['Prealca', 'Premezclado', 'Servicio']),
  clienteId: z.number().min(1, 'Cliente requerido'),
  guiaDespachoId: z.number().optional(),
  descripcion: z.string().optional(),
  cantidad: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
  precioUnitarioBolivares: z.number().min(0, 'Precio debe ser válido'),
  precioUnitarioDolares: z.number().optional(),
  aplicarIVA: z.boolean().default(true),
  referencia: z.string().optional(),
});

type FacturaFormData = z.infer<typeof facturaSchema>;

interface Cliente {
  id: number;
  nombre: string;
  rif: string;
}

interface GuiaDespacho {
  id: number;
  numeroGuia: string;
}

export function FacturaForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [guias, setGuias] = useState<GuiaDespacho[]>([]);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [conversionError, setConversionError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FacturaFormData>({
    resolver: zodResolver(facturaSchema),
    defaultValues: {
      tipoFactura: 'Prealca',
      aplicarIVA: true,
    },
  });

  const precioBolivares = watch('precioUnitarioBolivares');
  const tipoFactura = watch('tipoFactura');

  useEffect(() => {
    fetchClientes();
    fetchCurrencyRate();
  }, []);

  useEffect(() => {
    if (tipoFactura === 'Prealca') {
      fetchGuias();
    }
  }, [tipoFactura]);

  useEffect(() => {
    if (precioBolivares && exchangeRate) {
      const converted = convertCurrency(precioBolivares, exchangeRate);
      setValue('precioUnitarioDolares', parseFloat(converted.toFixed(2)));
    }
  }, [precioBolivares, exchangeRate, setValue]);

  const fetchCurrencyRate = async () => {
    try {
      const response = await convertCurrency(1, 0);
      setExchangeRate(response);
    } catch (error) {
      console.error('[v0] Error fetching currency rate:', error);
      setConversionError('No se pudo obtener la tasa de cambio actual');
      setExchangeRate(0);
    }
  };

  const fetchClientes = async () => {
    try {
      // API call would go here
      setClientes([]);
    } catch (error) {
      console.error('[v0] Error loading clientes:', error);
    }
  };

  const fetchGuias = async () => {
    try {
      // API call would go here
      setGuias([]);
    } catch (error) {
      console.error('[v0] Error loading guias:', error);
    }
  };

  const onSubmit = async (data: FacturaFormData) => {
    try {
      setLoading(true);
      console.log('[v0] Submitting factura:', data);
      // API call would go here
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('[v0] Error creating factura:', error);
      alert('Error al crear factura');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white rounded-lg shadow p-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Tipo de Factura</label>
          <select
            {...register('tipoFactura')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Prealca">Prealca (Cemento)</option>
            <option value="Premezclado">Premezclado (Concreto)</option>
            <option value="Servicio">Servicio</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Cliente *</label>
          <select
            {...register('clienteId', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecciona un cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </select>
          {errors.clienteId && <p className="text-red-600 text-sm mt-1">{errors.clienteId.message}</p>}
        </div>
      </div>

      {tipoFactura === 'Prealca' && (
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Guía de Despacho</label>
          <select
            {...register('guiaDespachoId', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecciona una guía (opcional)</option>
            {guias.map((guia) => (
              <option key={guia.id} value={guia.id}>
                Guía #{guia.numeroGuia}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Descripción</label>
        <textarea
          {...register('descripcion')}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="Detalles de la factura"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Cantidad *</label>
          <input
            type="number"
            step="0.01"
            {...register('cantidad', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.cantidad && <p className="text-red-600 text-sm mt-1">{errors.cantidad.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Precio Unitario (Bs) *</label>
          <input
            type="number"
            step="0.01"
            {...register('precioUnitarioBolivares', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.precioUnitarioBolivares && (
            <p className="text-red-600 text-sm mt-1">{errors.precioUnitarioBolivares.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Precio Unitario ($)</label>
          <input
            type="number"
            step="0.01"
            disabled
            {...register('precioUnitarioDolares', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Calculado automáticamente</p>
        </div>
      </div>

      {conversionError && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded text-sm">
          {conversionError}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register('aplicarIVA')}
          className="rounded border-gray-300"
        />
        <label className="text-sm font-medium text-gray-900">Aplicar IVA (16%)</label>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Referencia / Control</label>
        <input
          type="text"
          {...register('referencia')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="Número de control o referencia"
        />
      </div>

      <div className="pt-4 border-t">
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md"
        >
          {loading ? 'Creando factura...' : 'Crear Factura'}
        </Button>
      </div>
    </form>
  );
}
