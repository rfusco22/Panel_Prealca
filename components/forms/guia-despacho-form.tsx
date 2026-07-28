'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Truck, User, Package, Ruler, DollarSign, CheckCircle2, AlertCircle, Eye, Printer, Loader2 } from 'lucide-react';
import { printDocument, generateGuiaDespachoHtml } from '@/lib/document-templates';

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

function formatCurrencyBs(value: number) {
  return value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Bs';
}

interface GuiaDespachoFormProps {
  onSubmit: (data: GuiaFormData & { total: number; ivaMonto: number }) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<GuiaFormData>;
  title?: string;
  clientes?: Array<{ id: number; nombre: string }>;
  productos?: Array<{ id: number; nombre: string; resistencia?: string; pulgada?: string }>;
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
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<GuiaFormData>({
    resolver: zodResolver(guiaSchema),
    defaultValues: initialData,
  });

  const clienteId = watch('clienteId');
  const productoId = watch('productoId');
  const cantidadM3 = watch('cantidadM3');
  const precioM3 = watch('precioM3');
  const ivaAplicado = watch('ivaAplicado');

  const subtotal = (cantidadM3 || 0) * (precioM3 || 0);
  const ivaMonto = ivaAplicado ? subtotal * 0.16 : 0;
  const total = subtotal + ivaMonto;

  const clienteSeleccionado = clientes.find(c => c.id === Number(clienteId));
  const productoSeleccionado = productos.find(p => p.id === Number(productoId));
  const unidadSeleccionada = unidades.find(u => u.id === Number(watch('unidadId')));
  const chofer = watch('chofer');

  const handleFormSubmit = async (data: GuiaFormData) => {
    setError(null); setSubmitting(true);
    try {
      await onSubmit({ ...data, total, ivaMonto });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally { setSubmitting(false); }
  };

  const handlePrint = () => {
    printDocument(generateGuiaDespachoHtml({
      guidNumber: 'NUEVA',
      fecha: new Date().toISOString(),
      clienteNombre: clienteSeleccionado?.nombre || '—',
      placaVehiculo: unidadSeleccionada?.nombre || '—',
      chofer: chofer || '—',
      items: productoSeleccionado ? [{
        nombreMaterial: productoSeleccionado.nombre || `${productoSeleccionado.resistencia || ''} - ${productoSeleccionado.pulgada || ''}`,
        cantidad: Number(cantidadM3) || 0,
        unidadMedida: 'M\u00B3',
        precioUnitario: Number(precioM3) || 0,
        subtotalItem: subtotal,
      }] : [],
      total,
    }));
  };

  const inputCls = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-400 bg-white transition-all";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5";
  const errorCls = "text-red-500 text-xs mt-1 font-medium flex items-center gap-1";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-160px)]">
      {/* FORMULARIO */}
      <div className="p-8 overflow-y-auto">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="p-2.5 bg-green-50 rounded-xl"><Truck className="w-6 h-6 text-green-600" /></div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
              <p className="text-sm text-slate-500">Complete los datos para generar la guía</p>
            </div>
          </div>

          {error && <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-800 p-4 rounded-xl"><AlertCircle size={20} className="text-red-500 shrink-0" /><p className="text-sm font-medium">{error}</p></div>}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-sm font-bold shrink-0">1</span>
              <h3 className="text-lg font-semibold text-slate-900">Información General</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Tipo</label>
                <select {...register('tipo')} className={inputCls}>
                  <option value="">Seleccionar tipo...</option>
                  <option value="Prealca">Prealca</option>
                  <option value="Premezclado">Premezclado</option>
                </select>
                {errors.tipo && <p className={errorCls}><AlertCircle size={12} />{errors.tipo.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Cliente</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select {...register('clienteId')} className={`${inputCls} pl-10`}>
                    <option value="">Seleccionar cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                {errors.clienteId && <p className={errorCls}><AlertCircle size={12} />{errors.clienteId.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Producto</label>
                <div className="relative">
                  <Package size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select {...register('productoId')} className={`${inputCls} pl-10`}>
                    <option value="">Seleccionar producto...</option>
                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre || `${p.resistencia || ''} - ${p.pulgada || ''}`}</option>)}
                  </select>
                </div>
                {errors.productoId && <p className={errorCls}><AlertCircle size={12} />{errors.productoId.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Unidad de Transporte</label>
                <div className="relative">
                  <Truck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select {...register('unidadId')} className={`${inputCls} pl-10`}>
                    <option value="">Seleccionar unidad...</option>
                    {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre} ({u.tipo})</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-sm font-bold shrink-0">2</span>
              <h3 className="text-lg font-semibold text-slate-900">Detalles del Envío</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className={labelCls}>Cantidad (M&sup3;)</label>
                <div className="relative">
                  <Ruler size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input {...register('cantidadM3')} type="number" step="0.01" min="0.01" placeholder="0.00" className={`${inputCls} pl-10`} />
                </div>
                {errors.cantidadM3 && <p className={errorCls}><AlertCircle size={12} />{errors.cantidadM3.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Precio por M&sup3; (Bs)</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input {...register('precioM3')} type="number" step="0.01" min="0" placeholder="0.00" className={`${inputCls} pl-10`} />
                </div>
                {errors.precioM3 && <p className={errorCls}><AlertCircle size={12} />{errors.precioM3.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Chofer / Operario</label>
                <input {...register('chofer')} type="text" placeholder="Nombre del chofer" className={inputCls} />
                {errors.chofer && <p className={errorCls}><AlertCircle size={12} />{errors.chofer.message}</p>}
              </div>
            </div>
            <div className="flex items-center pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input {...register('ivaAplicado')} type="checkbox" className="sr-only peer" />
                  <div className="w-12 h-6 bg-slate-200 rounded-full peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6"></div>
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Aplicar IVA 16%</span>
              </label>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Subtotal</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrencyBs(subtotal)}</p>
              </div>
              {ivaAplicado && <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">IVA 16%</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrencyBs(ivaMonto)}</p>
              </div>}
              <div className={`rounded-xl border p-4 ${total > 0 ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total</p>
                <p className={`text-2xl font-black ${total > 0 ? 'text-blue-700' : 'text-slate-400'}`}>{formatCurrencyBs(total)}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => window.history.back()} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-200">Cancelar</button>
            <button type="submit" disabled={submitting || isLoading} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-700 active:scale-[0.98] text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              {(submitting || isLoading) && <Loader2 size={15} className="animate-spin" />}
              {(submitting || isLoading) ? 'Guardando...' : 'Guardar Guía de Despacho'}
            </button>
          </div>
        </form>
      </div>

      {/* VISTA PREVIA */}
      <div className="hidden lg:block border-l border-slate-200 bg-slate-50 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Eye size={18} />
            <span>Vista Previa del Documento</span>
          </div>
          <button type="button" onClick={handlePrint} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl transition-colors shadow-sm">
            <Printer size={16} />
            Imprimir
          </button>
        </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-8 text-sm text-slate-800 leading-relaxed">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-200">
              <div className="flex items-start gap-4">
                <img src="/logo.jpeg" alt="Prealca Logo" className="w-[100px] h-auto" />
              </div>
              <div className="text-right text-xs text-slate-600 mt-2">
                <p>Av. 2 parcela E-37, Zona Ind. Sta Cruz</p>
                <p>Estado Aragua</p>
                <p>Telf: 04128936930 / Roberto Quintero</p>
              </div>
            </div>

            <h4 className="text-center font-bold text-base text-slate-900 mb-4 tracking-wide">GUÍA DE DESPACHO: NUEVA</h4>
            <p className="text-right text-xs text-slate-500 mb-5">Fecha: {new Date().toLocaleDateString('es-VE')}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <p className="text-sm"><strong>Cliente:</strong> {clienteSeleccionado?.nombre || '—'}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm"><strong>Placa Vehículo:</strong> {unidadSeleccionada?.nombre || '—'}</p>
                <p className="text-sm"><strong>Chofer:</strong> {chofer || '—'}</p>
              </div>
            </div>

            <table className="w-full border-collapse mb-5 text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-3 py-2.5 text-left font-bold text-slate-900">Material</th>
                  <th className="border border-slate-300 px-3 py-2.5 text-right font-bold text-slate-900">Cantidad</th>
                  <th className="border border-slate-300 px-3 py-2.5 text-left font-bold text-slate-900">Unidad</th>
                  <th className="border border-slate-300 px-3 py-2.5 text-right font-bold text-slate-900">Precio Unit.</th>
                  <th className="border border-slate-300 px-3 py-2.5 text-right font-bold text-slate-900">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {productoSeleccionado ? (
                  <tr>
                    <td className="border border-slate-300 px-3 py-2.5">{productoSeleccionado.nombre || `${productoSeleccionado.resistencia || ''} - ${productoSeleccionado.pulgada || ''}`}</td>
                    <td className="border border-slate-300 px-3 py-2.5 text-right">{(Number(cantidadM3) || 0).toLocaleString('es-ES')}</td>
                    <td className="border border-slate-300 px-3 py-2.5">M&sup3;</td>
                    <td className="border border-slate-300 px-3 py-2.5 text-right">{formatCurrencyBs(Number(precioM3) || 0)}</td>
                    <td className="border border-slate-300 px-3 py-2.5 text-right">{formatCurrencyBs(subtotal)}</td>
                  </tr>
                ) : (
                  <tr><td colSpan={5} className="border border-slate-300 px-3 py-8 text-center text-slate-400">Seleccione un producto...</td></tr>
                )}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-72 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span><strong>SUB TOTAL:</strong></span>
                  <span>{formatCurrencyBs(subtotal)}</span>
                </div>
                {ivaAplicado && <div className="flex justify-between">
                  <span><strong>I.V.A. 16%:</strong></span>
                  <span>{formatCurrencyBs(ivaMonto)}</span>
                </div>}
                <div className="flex justify-between font-black text-base border-t border-slate-200 pt-2">
                  <span>TOTAL:</span>
                  <span>{formatCurrencyBs(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
