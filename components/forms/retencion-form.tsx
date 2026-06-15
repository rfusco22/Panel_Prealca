'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';

const retencionSchema = z.object({
  tipoRetencion: z.enum(['IVA', 'ISLR', 'Otra']),
  facturaId: z.number().min(1, 'Factura requerida'),
  baseImponible: z.number().min(0, 'Base imponible debe ser válida'),
  porcentajeRetencion: z.number().min(0).max(100),
  montoRetencion: z.number().min(0),
  referencia: z.string().optional(),
  observaciones: z.string().optional(),
});

type RetencionFormData = z.infer<typeof retencionSchema>;

interface Factura {
  id: number;
  numeroFactura: string;
  montoTotal: number;
}

export function RetencionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RetencionFormData>({
    resolver: zodResolver(retencionSchema),
    defaultValues: {
      tipoRetencion: 'IVA',
      porcentajeRetencion: 75, // Default for IVA special taxpayers
    },
  });

  const baseImponible = watch('baseImponible');
  const porcentaje = watch('porcentajeRetencion');
  const tipoRetencion = watch('tipoRetencion');

  useEffect(() => {
    fetchFacturas();
  }, []);

  useEffect(() => {
    // Auto-calculate retention amount
    const monto = (baseImponible * porcentaje) / 100;
    setValue('montoRetencion', parseFloat(monto.toFixed(2)));
  }, [baseImponible, porcentaje, setValue]);

  useEffect(() => {
    // Update porcentage based on retention type
    if (tipoRetencion === 'IVA') {
      setValue('porcentajeRetencion', 75); // 75% of IVA for special taxpayers
    } else if (tipoRetencion === 'ISLR') {
      setValue('porcentajeRetencion', 75); // Typical ISLR retention
    }
  }, [tipoRetencion, setValue]);

  const fetchFacturas = async () => {
    try {
      // API call would go here
      setFacturas([]);
    } catch (error) {
      console.error('[v0] Error loading facturas:', error);
    }
  };

  const onSubmit = async (data: RetencionFormData) => {
    try {
      setLoading(true);
      console.log('[v0] Submitting retencion:', data);
      // API call would go here
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('[v0] Error creating retencion:', error);
      alert('Error al crear retención');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white rounded-lg shadow p-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <p className="text-blue-900 text-sm font-medium">
          Las retenciones se aplican automáticamente a facturas. Para proveedores especiales, se retiene el 75% del IVA.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Tipo de Retención</label>
          <select
            {...register('tipoRetencion')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="IVA">IVA (75% para contribuyentes especiales)</option>
            <option value="ISLR">ISLR (Impuesto sobre la renta)</option>
            <option value="Otra">Otra retención</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Factura *</label>
          <select
            {...register('facturaId', { valueAsNumber: true })}
            onChange={(e) => {
              const id = parseInt(e.target.value);
              const factura = facturas.find((f) => f.id === id);
              setSelectedFactura(factura || null);
              if (factura) {
                setValue('baseImponible', factura.montoTotal);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecciona una factura</option>
            {facturas.map((factura) => (
              <option key={factura.id} value={factura.id}>
                Factura #{factura.numeroFactura} - Bs. {factura.montoTotal.toFixed(2)}
              </option>
            ))}
          </select>
          {errors.facturaId && <p className="text-red-600 text-sm mt-1">{errors.facturaId.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Base Imponible (Bs) *</label>
          <input
            type="number"
            step="0.01"
            {...register('baseImponible', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.baseImponible && <p className="text-red-600 text-sm mt-1">{errors.baseImponible.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Porcentaje (%)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...register('porcentajeRetencion', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Monto Retención (Bs)</label>
          <input
            type="number"
            step="0.01"
            disabled
            {...register('montoRetencion', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed font-semibold"
          />
          <p className="text-xs text-gray-500 mt-1">Calculado automáticamente</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Referencia / Comprobante</label>
        <input
          type="text"
          {...register('referencia')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="Número de comprobante de retención"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Observaciones</label>
        <textarea
          {...register('observaciones')}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="Notas adicionales sobre la retención"
        />
      </div>

      <div className="pt-4 border-t">
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md"
        >
          {loading ? 'Registrando retención...' : 'Registrar Retención'}
        </Button>
      </div>
    </form>
  );
}
