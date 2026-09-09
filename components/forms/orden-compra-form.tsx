'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Building2, Package, Ruler, DollarSign, Calculator, Loader2, CheckCircle2, AlertCircle, Eye, Printer, Calendar, Banknote, Plus, X } from 'lucide-react';
import { printDocument, generateOrdenCompraHtml } from '@/lib/document-templates';
import { formatearFecha, hoyLocal } from '@/lib/fecha';
const ordenCompraSchema = z.object({
  fecha: z.string().min(1, 'Fecha requerida'),
  tipo: z.enum(['Prealca', 'Premezclado'], { message: 'Selecciona un tipo válido' }),
  proveedorId: z.coerce.number().min(1, 'Debe seleccionar un proveedor'),
  productoId: z.coerce.number().min(1, 'Debe seleccionar un producto'),
  cantidadM3: z.coerce.number().min(0.01, 'Cantidad mínima 0.01 m³'),
  precioM3: z.coerce.number().min(0, 'Precio debe ser positivo'),
  ivaAplicado: z.boolean().default(false),
});

// Con z.coerce.* el tipo de ENTRADA del form (lo que escribe el usuario) y el
// de SALIDA (ya convertido a number) son distintos. useForm necesita ambos.
type OrdenCompraFormInput = z.input<typeof ordenCompraSchema>;
type OrdenCompraFormData = z.output<typeof ordenCompraSchema>;

export interface OrdenCompraInitialData {
  id: number;
  fecha: string;
  tipo: string;
  proveedorId: number;
  productoId: number;
  cantidadM3: number;
  precioM3: number;
  ivaAplicado: boolean;
}

export interface OrdenCompraFormProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  initialData?: OrdenCompraInitialData | null;
}

function formatCurrencyBs(value: number) {
  return value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Bs';
}

function formatCurrencyUsd(value: number) {
  return '$ ' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getTodayStr() {
  return hoyLocal();
}

export function OrdenCompraForm({ onSubmit, isLoading = false, initialData }: OrdenCompraFormProps) {
  const isEditing = !!initialData;
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showProveedorModal, setShowProveedorModal] = useState(false);
  const [newProveedor, setNewProveedor] = useState({ nombre: '', rif: '', direccion: '' });
  const [savingProveedor, setSavingProveedor] = useState(false);

  const [moneda, setMoneda] = useState<'$' | 'Bs'>('$');
  const [tasaBCV, setTasaBCV] = useState<number>(0);
  const [loadingTasa, setLoadingTasa] = useState(true);

  const { register, handleSubmit, watch, setValue } = useForm<OrdenCompraFormInput, any, OrdenCompraFormData>({
    resolver: zodResolver(ordenCompraSchema),
    defaultValues: {
      fecha: initialData?.fecha || getTodayStr(),
      tipo: initialData?.tipo as any,
      proveedorId: initialData?.proveedorId,
      productoId: initialData?.productoId,
      cantidadM3: initialData?.cantidadM3,
      precioM3: initialData?.precioM3,
      ivaAplicado: initialData?.ivaAplicado || false,
    },
  });

  const tipo = watch('tipo');
  const proveedorId = watch('proveedorId');
  const productoId = watch('productoId');
  // watch() devuelve el valor crudo del input (string), no el numero que produce
  // el schema al validar, asi que se convierte una sola vez acá.
  const cantidadM3 = Number(watch('cantidadM3')) || 0;
  const precioM3 = Number(watch('precioM3')) || 0;
  const ivaAplicado = watch('ivaAplicado');

  useEffect(() => {
    if (tipo === 'Prealca') {
      setValue('ivaAplicado', true);
    } else if (tipo === 'Premezclado') {
      setValue('ivaAplicado', false);
    }
  }, [tipo, setValue]);

  useEffect(() => {
    setLoadingTasa(true);
    fetch('/api/bcv')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.tasa) {
          setTasaBCV(d.tasa);
        }
      })
      .catch(() => setTasaBCV(0))
      .finally(() => setLoadingTasa(false));
  }, []);

  const precioEnBs = moneda === '$' ? (precioM3 || 0) : (precioM3 || 0) * tasaBCV;
  const subtotal = precioEnBs * (cantidadM3 || 0);
  const ivaMonto = ivaAplicado ? subtotal * 0.16 : 0;
  const total = subtotal + ivaMonto;

  const proveedorSeleccionado = proveedores.find((p: any) => p.id === Number(proveedorId));
  const productoSeleccionado = productos.find((p: any) => p.id === Number(productoId));

  useEffect(() => {
    // El <select> de proveedor/producto recien tiene opciones una vez que esto
    // resuelve, asi que el valor precargado en modo edicion se pierde si no se
    // re-aplica aca.
    fetch('/api/proveedores').then(r => r.json()).then(d => {
      if (d.success) {
        setProveedores(d.proveedores);
        if (initialData?.proveedorId) setValue('proveedorId', initialData.proveedorId);
      }
    });
    fetch('/api/productos').then(r => r.json()).then(d => {
      setProductos(Array.isArray(d) ? d : d.productos || []);
      if (initialData?.productoId) setValue('productoId', initialData.productoId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormSubmit = async (data: OrdenCompraFormData) => {
    setError(null); setSuccess(null); setSubmitting(true);
    try {
      await onSubmit({ ...(isEditing ? { id: initialData!.id } : {}), ...data, ivaMonto, total, moneda, tasaBCV });
      setSuccess(isEditing ? 'Orden de compra actualizada exitosamente' : 'Orden de compra creada exitosamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally { setSubmitting(false); }
  };

  const handleSaveProveedor = async () => {
    if (!newProveedor.nombre || !newProveedor.rif) return;
    setSavingProveedor(true);
    try {
      const res = await fetch('/api/proveedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProveedor),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const response = await fetch('/api/proveedores');
        const d = await response.json();
        if (d.success) setProveedores(d.proveedores);
        if (data.insertId) setValue('proveedorId', data.insertId);
        setShowProveedorModal(false);
        setNewProveedor({ nombre: '', rif: '', direccion: '' });
      }
    } catch (e) {} finally { setSavingProveedor(false); }
  };

  const handlePrint = () => {
    const prod = productoSeleccionado;
    printDocument(generateOrdenCompraHtml({
      poNumber: isEditing ? `OC-${initialData!.id}` : 'NUEVA',
      fecha: watch('fecha') || new Date().toISOString(),
      tipo: watch('tipo'),
      proveedorNombre: proveedorSeleccionado?.nombre || '—',
      proveedorRif: proveedorSeleccionado?.rif || '—',
      proveedorDireccion: proveedorSeleccionado?.direccion || '—',
      proveedorContacto: proveedorSeleccionado?.contacto || 'N/A',
      proveedorTelefono: proveedorSeleccionado?.telefono || 'N/A',
      items: prod ? [{
        nombreMaterial: prod.nombre || `${prod.resistencia || ''} - ${prod.pulgada || ''}`,
        cantidad: Number(cantidadM3) || 0,
        unidadMedida: 'M\u00B3',
        precioUnitario: precioEnBs,
        subtotalItem: subtotal,
      }] : [],
      total,
    }));
  };

  const inputCls = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-400 bg-white transition-all";
  const inputDisabledCls = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 bg-slate-50 cursor-not-allowed";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-160px)]">
      {/* FORMULARIO */}
      <div className="p-8 overflow-y-auto">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="p-2.5 bg-blue-50 rounded-xl"><Calculator className="w-6 h-6 text-blue-600" /></div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{isEditing ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}</h2>
              <p className="text-sm text-slate-500">{isEditing ? 'Actualiza los datos de la orden' : 'Complete los datos para generar la orden'}</p>
            </div>
          </div>

          {error && <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-800 p-4 rounded-xl"><AlertCircle size={20} className="text-red-500 shrink-0" /><p className="text-sm font-medium">{error}</p></div>}
          {success && <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl"><CheckCircle2 size={20} className="text-emerald-500 shrink-0" /><p className="text-sm font-medium">{success}</p></div>}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-sm font-bold shrink-0">1</span>
              <h3 className="text-lg font-semibold text-slate-900">Información General</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Fecha</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input {...register('fecha')} type="date" readOnly className={`${inputDisabledCls} pl-10`} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Tipo</label>
                <select {...register('tipo')} className={inputCls}>
                  <option value="">Seleccionar tipo...</option>
                  <option value="Prealca">Prealca</option>
                  <option value="Premezclado">Premezclado</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Proveedor</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select {...register('proveedorId')} className={`${inputCls} pl-10`}>
                      <option value="">Seleccionar proveedor...</option>
                      {proveedores.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={() => setShowProveedorModal(true)} className="px-3 bg-slate-900 hover:bg-slate-700 text-white rounded-xl shadow-sm transition-all" title="Nuevo proveedor">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Descripción (Producto)</label>
                <div className="relative">
                  <Package size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select {...register('productoId')} className={`${inputCls} pl-10`}>
                    <option value="">Seleccionar producto...</option>
                    {productos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre || `${p.resistencia || ''} - ${p.pulgada || ''}`}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-sm font-bold shrink-0">2</span>
              <h3 className="text-lg font-semibold text-slate-900">Cantidades y Precios</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Cantidad (M&sup3;)</label>
                <div className="relative">
                  <Ruler size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input {...register('cantidadM3')} type="number" step="0.01" min="0.01" placeholder="0.00" className={`${inputCls} pl-10`} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelCls}>Precio por M&sup3;</label>
                  <div className="flex bg-slate-100 rounded-lg p-0.5">
                    <button type="button" onClick={() => setMoneda('$')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${moneda === '$' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                      $
                    </button>
                    <button type="button" onClick={() => setMoneda('Bs')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${moneda === 'Bs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                      Bs
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">{moneda === '$' ? '$' : '$'}</span>
                  <input {...register('precioM3')} type="number" step="0.01" min="0" placeholder="0.00" className={`${inputCls} pl-8`} />
                </div>
                {moneda === 'Bs' && tasaBCV > 0 && (precioM3 || 0) > 0 && (
                  <p className="text-[10px] text-emerald-600 mt-1.5 font-medium">
                    = {formatCurrencyBs(tasaBCV * (precioM3 || 0) * (cantidadM3 || 0))}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input {...register('ivaAplicado')} type="checkbox" className="sr-only peer" disabled={tipo === 'Prealca' || tipo === 'Premezclado'} />
                  <div className="w-12 h-6 bg-slate-200 rounded-full peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Aplicar IVA 16%</span>
              </label>
              {tipo && (
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${tipo === 'Prealca' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                  {tipo === 'Prealca' ? 'Prealca = IVA incluido' : 'Premezclado = Sin IVA'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              {loadingTasa ? (
                <><Loader2 size={12} className="animate-spin" /> Cargando tasa BCV...</>
              ) : tasaBCV > 0 ? (
                <><span className="font-bold text-emerald-600">Tasa BCV:</span> {tasaBCV.toLocaleString('es-VE')} Bs/$</>
              ) : (
                <span className="text-amber-600">No se pudo cargar la tasa BCV</span>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className={`grid gap-4 ${ivaAplicado ? 'grid-cols-3' : 'grid-cols-2'}`}>
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
              {(submitting || isLoading) ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Generar Orden de Compra'}
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

            <p className="text-xs text-slate-500 mb-2">RIF.: J-30913171-0</p>
            <h4 className="text-center font-bold text-base text-slate-900 mb-4 tracking-wide">ORDEN DE COMPRA A PROVEEDOR: {isEditing ? `OC-${initialData!.id}` : 'NUEVA'}</h4>
            <div className="flex justify-between items-center mb-5">
              <p className="text-xs text-slate-500"><span className="font-semibold">Tipo:</span> {tipo || '—'}</p>
              <p className="text-xs text-slate-500"><span className="font-semibold">Fecha:</span> {watch('fecha') ? formatearFecha(watch('fecha') + 'T00:00:00') : '—'}</p>
            </div>

            <div className="mb-4 space-y-1.5">
              <p className="text-sm"><strong>Proveedor:</strong> {proveedorSeleccionado?.nombre || '—'}</p>
              <p className="text-sm"><strong>RIF:</strong> {proveedorSeleccionado?.rif || '—'}</p>
              <p className="text-sm"><strong>Dirección:</strong> {proveedorSeleccionado?.direccion || '—'}</p>
              <p className="text-sm"><strong>CONTACTO:</strong> {proveedorSeleccionado?.contacto || 'N/A'}</p>
              <p className="text-sm"><strong>TELF:</strong> {proveedorSeleccionado?.telefono || 'N/A'}</p>
            </div>

            <table className="w-full border-collapse mb-5 text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-3 py-2.5 text-left font-bold text-slate-900">Descripción</th>
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
                    <td className="border border-slate-300 px-3 py-2.5 text-right">
                      {moneda === '$' ? formatCurrencyUsd(Number(precioM3) || 0) : formatCurrencyBs(tasaBCV * (Number(precioM3) || 0))}
                    </td>
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

      {showProveedorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowProveedorModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Nuevo Proveedor</h3>
              <button onClick={() => setShowProveedorModal(false)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Nombre *</label>
                <input type="text" value={newProveedor.nombre} onChange={e => setNewProveedor({ ...newProveedor, nombre: e.target.value })} placeholder="Nombre del proveedor" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>RIF *</label>
                <input type="text" value={newProveedor.rif} onChange={e => setNewProveedor({ ...newProveedor, rif: e.target.value })} placeholder="J-12345678" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Direccion</label>
                <input type="text" value={newProveedor.direccion} onChange={e => setNewProveedor({ ...newProveedor, direccion: e.target.value })} placeholder="Direccion" className={inputCls} />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => setShowProveedorModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 transition-all">Cancelar</button>
              <button type="button" onClick={handleSaveProveedor} disabled={savingProveedor || !newProveedor.nombre || !newProveedor.rif} className="px-5 py-2 bg-slate-900 hover:bg-slate-700 active:scale-[0.98] text-white text-sm font-medium rounded-lg shadow-md transition-all disabled:opacity-40 flex items-center gap-2">
                {savingProveedor && <Loader2 size={14} className="animate-spin" />}
                {savingProveedor ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
