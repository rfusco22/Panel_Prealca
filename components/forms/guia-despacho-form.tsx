'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Truck, User, Package, Ruler, AlertCircle, Eye, Printer, Loader2, Box } from 'lucide-react';
import { printDocument, generateGuiaDespachoHtml, generatePrealcaHtml, generateServicioBombaHtml } from '@/lib/document-templates';

const guiaSchema = z.object({
  clienteId: z.coerce.number().min(1, 'Debe seleccionar un cliente'),
  productoId: z.coerce.number().min(1, 'Debe seleccionar un producto'),
  cantidadM3: z.coerce.number().min(0.01, 'Cantidad mínima 0.01 m³'),
  chofer: z.string().min(3, 'Nombre del chofer requerido'),
  unidadId: z.coerce.number().optional(),
  pedidoId: z.coerce.number().optional(),
  obra: z.string().optional(),
});

// Con z.coerce.* el tipo de ENTRADA del form (lo que escribe el usuario) y el
// de SALIDA (ya convertido a number) son distintos. useForm necesita ambos.
type GuiaFormInput = z.input<typeof guiaSchema>;
type GuiaFormData = z.output<typeof guiaSchema>;

interface GuiaDespachoFormProps {
  onSubmit: (data: GuiaFormData & { tipo: string; total: number; ivaMonto: number }) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<GuiaFormData>;
  title?: string;
  clientes?: Array<{ id: number; nombre: string; rif?: string; direccion?: string; telefono?: string }>;
  // "nombre" es opcional: /api/productos no lo devuelve y abajo se arma con
  // resistencia + pulgada cuando falta.
  productos?: Array<{ id: number; nombre?: string; resistencia?: string; pulgada?: string; unidad?: string }>;
  unidades?: Array<{ id: number; nombre: string; tipo: string }>;
  choferes?: Array<{ id: number; nombre: string }>;
  pedidos?: Array<{ id: number; clienteId: number; clienteNombre: string; productoId: number; productoNombre: string; totalM3: number; acumuladoM3: number; obra: string | null }>;
  stockProductos?: Array<{ productoId: number; stockDisponible: number }>;
}

export function GuiaDespachoForm({
  onSubmit,
  isLoading = false,
  initialData,
  title = 'Nueva Guía de Despacho',
  clientes = [],
  productos = [],
  unidades = [],
  choferes = [],
  pedidos = [],
  stockProductos = [],
}: GuiaDespachoFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tipoMode, setTipoMode] = useState<'Premezclado' | 'Prealca' | 'Servicio de Bomba'>('Premezclado');
  const [stockMap, setStockMap] = useState<Record<number, number>>({});

  useEffect(() => {
    if (stockProductos.length > 0) {
      const map: Record<number, number> = {};
      stockProductos.forEach(s => { map[s.productoId] = s.stockDisponible; });
      setStockMap(map);
    } else {
      fetch('/api/stock')
        .then(res => res.json())
        .then(data => {
          if (data.productos) {
            const map: Record<number, number> = {};
            data.productos.forEach((p: any) => { map[p.productoId] = Number(p.stockDisponible); });
            setStockMap(map);
          }
        })
        .catch(() => {});
    }
  }, [stockProductos]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<GuiaFormInput, any, GuiaFormData>({
    resolver: zodResolver(guiaSchema),
    defaultValues: initialData,
  });

  const clienteId = watch('clienteId');
  const productoId = watch('productoId');
  const cantidadM3 = watch('cantidadM3');
  const pedidoId = watch('pedidoId');

  const esPrealca = tipoMode === 'Prealca';
  const esServicioBomba = tipoMode === 'Servicio de Bomba';

  const clienteSeleccionado = clientes.find(c => c.id === Number(clienteId));
  const productoSeleccionado = productos.find(p => p.id === Number(productoId));
  const unidadSeleccionada = unidades.find(u => u.id === Number(watch('unidadId')));
  const chofer = watch('chofer');

  const pedidoSeleccionado = pedidos.find(p => p.id === Number(pedidoId));
  const vanM3 = pedidoSeleccionado ? (Number(pedidoSeleccionado.acumuladoM3) || 0) + (Number(cantidadM3) || 0) : 0;
  const deM3 = pedidoSeleccionado ? Number(pedidoSeleccionado.totalM3) || 0 : 0;

  const [horaSalida] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });
  });

  const handleFormSubmit = async (data: GuiaFormData) => {
    setError(null);

    const stock = stockMap[Number(data.productoId)];
    if (stock !== undefined && stock <= 0) {
      setError(`No hay stock disponible para este producto. Stock actual: ${stock} M³`);
      return;
    }
    if (stock !== undefined && Number(data.cantidadM3) > stock) {
      setError(`La cantidad solicitada (${data.cantidadM3} M³) excede el stock disponible (${stock} M³)`);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ ...data, tipo: tipoMode, total: 0, ivaMonto: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally { setSubmitting(false); }
  };

  const handlePrint = () => {
    if (esServicioBomba) {
      printDocument(generateServicioBombaHtml({
        guiaNumber: 'NUEVA',
        fecha: new Date().toISOString(),
        clienteNombre: clienteSeleccionado?.nombre || '',
        clienteRif: clienteSeleccionado?.rif || '',
        clienteDireccion: clienteSeleccionado?.direccion || '',
        clienteTelefono: clienteSeleccionado?.telefono || '',
        operador: chofer || '',
        unidad: unidadSeleccionada?.tipo || '',
        items: productoSeleccionado ? [{
          resistencia: productoSeleccionado.resistencia || '',
          pulgada: productoSeleccionado.pulgada || '',
          cantidad: Number(cantidadM3) || 0,
        }] : [],
      }));
    } else if (esPrealca) {
      printDocument(generatePrealcaHtml({
        guiaNumber: 'NUEVA',
        fecha: new Date().toISOString(),
        clienteNombre: clienteSeleccionado?.nombre || '',
        clienteRif: clienteSeleccionado?.rif || '',
        clienteDireccion: clienteSeleccionado?.direccion || '',
        clienteTelefono: clienteSeleccionado?.telefono || '',
        obra: watch('obra') || '',
        chofer: chofer || '',
        placa: unidadSeleccionada?.tipo || '',
        vanM3: pedidoSeleccionado ? vanM3 : Number(cantidadM3) || 0,
        deM3: pedidoSeleccionado ? deM3 : 0,
        items: productoSeleccionado ? [{
          resistencia: productoSeleccionado.resistencia || '',
          pulgada: productoSeleccionado.pulgada || '',
          cantidad: Number(cantidadM3) || 0,
        }] : [],
      }));
    } else {
      printDocument(generateGuiaDespachoHtml({
        guiaNumber: 'NUEVA',
        fecha: new Date().toISOString(),
        clienteNombre: clienteSeleccionado?.nombre || '',
        clienteRif: clienteSeleccionado?.rif || '',
        clienteDireccion: clienteSeleccionado?.direccion || '',
        clienteTelefono: clienteSeleccionado?.telefono || '',
        chofer: chofer || '',
        placa: unidadSeleccionada?.tipo || '',
        vanM3: pedidoSeleccionado ? vanM3 : Number(cantidadM3) || 0,
        deM3: pedidoSeleccionado ? deM3 : 0,
        items: productoSeleccionado ? [{
          nombreProducto: productoSeleccionado.nombre || `${productoSeleccionado.resistencia || ''} - ${productoSeleccionado.pulgada || ''}`,
          resistencia: productoSeleccionado.resistencia || '',
          pulgada: productoSeleccionado.pulgada || '',
          cantidad: Number(cantidadM3) || 0,
          unidadMedida: 'M\u00B3',
          precioUnitario: 0,
          subtotalItem: 0,
        }] : [],
        total: 0,
      }));
    }
  };

  const inputCls = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-400 bg-white transition-all";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5";
  const errorCls = "text-red-500 text-xs mt-1 font-medium flex items-center gap-1";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-160px)]">
      {/* FORMULARIO */}
      <div className="p-8 overflow-y-auto">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Toggle PREMEZCLADO / PREALCA / SERVICIO DE BOMBA */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button type="button" onClick={() => setTipoMode('Premezclado')} className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${tipoMode === 'Premezclado' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                PREMEZCLADO
              </button>
              <button type="button" onClick={() => setTipoMode('Prealca')} className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${tipoMode === 'Prealca' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                PREALCA
              </button>
              <button type="button" onClick={() => setTipoMode('Servicio de Bomba')} className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${tipoMode === 'Servicio de Bomba' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                SERVICIO DE BOMBA
              </button>
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">
              {esPrealca ? 'Guía de Despacho Prealca — Sin IVA' : esServicioBomba ? 'Orden Servicio de Bomba — IVA 16% incluido' : 'Guía de Despacho — Sin IVA'}
            </p>
          </div>

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
              <div className="sm:col-span-2">
                <label className={labelCls}>Pedido Asociado (opcional)</label>
                <select {...register('pedidoId')} className={inputCls} onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    const pedido = pedidos.find(p => p.id === Number(val));
                    if (pedido) {
                      const form = document.querySelector('form');
                      if (form) {
                        const clienteSelect = form.querySelector('[name="clienteId"]') as HTMLSelectElement;
                        const productoSelect = form.querySelector('[name="productoId"]') as HTMLSelectElement;
                        const obraInput = form.querySelector('[name="obra"]') as HTMLInputElement;
                        if (clienteSelect) clienteSelect.value = String(pedido.clienteId);
                        if (productoSelect) productoSelect.value = String(pedido.productoId);
                        if (obraInput && pedido.obra) obraInput.value = pedido.obra;
                        clienteSelect?.dispatchEvent(new Event('change', { bubbles: true }));
                        productoSelect?.dispatchEvent(new Event('change', { bubbles: true }));
                        if (obraInput && pedido.obra) obraInput.dispatchEvent(new Event('change', { bubbles: true }));
                      }
                    }
                  }
                }}>
                  <option value="">Sin pedido (guía independiente)</option>
                  {pedidos.map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.id} — {p.clienteNombre} — {p.productoNombre} — {Number(p.acumuladoM3).toFixed(1)}/{Number(p.totalM3).toFixed(1)} M³
                    </option>
                  ))}
                </select>
              </div>
              {pedidoSeleccionado && pedidoSeleccionado.obra && (
                <div className="sm:col-span-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Obra del Pedido</span>
                  </div>
                  <p className="text-sm font-medium text-blue-800 mt-1">{pedidoSeleccionado.obra}</p>
                </div>
              )}
              <div>
                <label className={labelCls}>Obra (opcional)</label>
                <input type="text" {...register('obra')} placeholder="Nombre de la obra..." className={inputCls} />
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
                {Number(productoId) > 0 && stockMap[Number(productoId)] !== undefined && (
                  <div className={`mt-1.5 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${
                    stockMap[Number(productoId)] <= 0 ? 'bg-red-50 text-red-600' :
                    stockMap[Number(productoId)] < 50 ? 'bg-amber-50 text-amber-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    <Box size={12} />
                    Stock disponible: {stockMap[Number(productoId)]} M³
                    {stockMap[Number(productoId)] <= 0 && ' — AGOTADO'}
                  </div>
                )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Cantidad (M&sup3;)</label>
                <div className="relative">
                  <Ruler size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input {...register('cantidadM3')} type="number" step="0.01" min="0.01" placeholder="0.00" className={`${inputCls} pl-10`} />
                </div>
                {errors.cantidadM3 && <p className={errorCls}><AlertCircle size={12} />{errors.cantidadM3.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Chofer / Operario</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select {...register('chofer')} className={`${inputCls} pl-10`}>
                    <option value="">Seleccionar chofer...</option>
                    {choferes.map(ch => <option key={ch.id} value={ch.nombre}>{ch.nombre}</option>)}
                  </select>
                </div>
                {errors.chofer && <p className={errorCls}><AlertCircle size={12} />{errors.chofer.message}</p>}
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
            <span>Vista Previa — {esPrealca ? 'Guía de Despacho Prealca' : esServicioBomba ? 'Orden Servicio de Bomba' : 'Guía de Despacho'}</span>
          </div>
          <button type="button" onClick={handlePrint} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl transition-colors shadow-sm">
            <Printer size={16} />
            Imprimir
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-6 text-sm text-slate-800 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>

            {esServicioBomba ? (
              /* ===== SERVICIO DE BOMBA ===== */
              <>
                <div className="flex justify-between items-start mb-4 pb-3 border-b-2 border-slate-800">
                  <div className="flex items-start gap-3">
                    <img src="/logo.jpeg" alt="Prealca" className="w-[70px] h-auto" />
                    <div className="text-[9px] text-slate-600 leading-tight">
                      <p className="font-bold">CALLE ZONA INDUSTRIAL, 2DA ETAPA, PARCELA</p>
                      <p className="font-bold">E-37 ZONA INDUSTRIAL SANTA CRUZ</p>
                      <p>SANTA CRUZ DE ARAGUA - EDO. ARAGUA</p>
                      <p>TELEFAX: (0243) 251.75.33</p>
                      <p>TELÉFONOS: (0414) 454.00.42 (0412) 435.09.07</p>
                      <p>0412 844.52.30</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Orden Servicio de Bomba</p>
                    <p className="text-sm font-bold text-red-600 mt-0.5">Nº NUEVA</p>
                  </div>
                  <div className="text-right text-[10px] space-y-1">
                    <div className="border border-slate-400 px-2 py-1">
                      <span className="font-semibold text-slate-500">Fecha de Emisión:</span>{' '}
                      <span className="text-slate-700">{new Date().toLocaleDateString('es-VE')}</span>
                    </div>
                    <div className="border border-slate-400 px-2 py-1">
                      <span className="font-semibold text-slate-500">Fecha de Vencimiento:</span>{' '}
                      <span className="text-slate-400">___/___/______</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3 text-xs">
                  <div className="flex gap-2">
                    <span className="font-semibold w-24 shrink-0">CLIENTE:</span>
                    <span className="flex-1 border-b border-slate-400">{clienteSeleccionado?.nombre || ''}</span>
                    <span className="font-semibold w-10 shrink-0">R.I.F:</span>
                    <span className="w-40 border-b border-slate-400">{clienteSeleccionado?.rif || ''}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold w-24 shrink-0">DIRECCIÓN:</span>
                    <span className="flex-1 border-b border-slate-400">{clienteSeleccionado?.direccion || ''}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold w-24 shrink-0">TELÉFONOS:</span>
                    <span className="flex-1 border-b border-slate-400">{clienteSeleccionado?.telefono || ''}</span>
                    <span className="font-semibold w-12 shrink-0">N.I.T:</span>
                    <span className="w-36 border-b border-slate-400"></span>
                    <span className="font-semibold w-28 shrink-0">CONDICIONES:</span>
                    <span className="flex-1 border-b border-slate-400"></span>
                  </div>
                </div>

                <div className="border border-slate-400 mb-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-400 px-2 py-2 text-center font-bold w-[12%]">N° GUÍA</th>
                        <th className="border border-slate-400 px-2 py-2 text-center font-bold w-[20%]">RC</th>
                        <th className="border border-slate-400 px-2 py-2 text-center font-bold w-[10%]">CANT.</th>
                        <th className="border border-slate-400 px-2 py-2 text-center font-bold w-[12%]">N° GUÍA</th>
                        <th className="border border-slate-400 px-2 py-2 text-center font-bold w-[20%]">RC</th>
                        <th className="border border-slate-400 px-2 py-2 text-center font-bold w-[10%]">CANT.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productoSeleccionado ? (
                        <tr>
                          <td className="border border-slate-400 px-2 py-5 text-center"></td>
                          <td className="border border-slate-400 px-2 py-5 text-center">{productoSeleccionado.resistencia || ''}</td>
                          <td className="border border-slate-400 px-2 py-5 text-center">{Number(cantidadM3) || 0}</td>
                          <td className="border border-slate-400 px-2 py-5 text-center"></td>
                          <td className="border border-slate-400 px-2 py-5 text-center"></td>
                          <td className="border border-slate-400 px-2 py-5 text-center"></td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={6} className="border border-slate-400 px-2 py-8 text-center text-slate-400">Seleccione un producto...</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-1.5 text-xs mb-3">
                  <div className="flex gap-2">
                    <span className="font-semibold w-20 shrink-0">UNIDAD:</span>
                    <span className="w-48 border-b border-slate-400">{unidadSeleccionada?.tipo || ''}</span>
                    <span className="font-semibold w-24 shrink-0">OPERADOR:</span>
                    <span className="flex-1 border-b border-slate-400">{chofer || ''}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex gap-2">
                    <span className="font-semibold w-28 shrink-0">Observaciones:</span>
                    <span className="flex-1 border-b border-slate-400"></span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold w-28 shrink-0">NOMBRE:</span>
                    <span className="flex-1 border-b border-slate-400"></span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold w-28 shrink-0">FECHA:</span>
                    <span className="flex-1 border-b border-slate-400"></span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold w-28 shrink-0">HORA:</span>
                    <span className="flex-1 border-b border-slate-400"></span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold w-28 shrink-0">CLIENTE:</span>
                    <span className="flex-1 border-b border-slate-400"></span>
                  </div>
                </div>
              </>
            ) : esPrealca ? (
              /* ===== PREALCA - GUÍA DE DESPACHO (HORIZONTAL) ===== */
              <>
                {/* HEADER */}
                <div className="flex justify-between items-start mb-2 pb-2 border-b-2 border-black">
                  <div className="flex items-start gap-2">
                    <img src="/logo.jpeg" alt="Prealca" className="w-[110px] h-auto" />
                    <div className="text-[8px] leading-tight mt-1">
                      <p className="font-bold text-[9px]">PREALCA, C.A.</p>
                      <p>CALLE ZONA INDUSTRIAL, 2da ETAPA, PARCELA E-37 ZONA INDUSTRIAL SANTA CRUZ</p>
                      <p>SANTA CRUZ DE ARAGUA - EDO. ARAGUA</p>
                      <p>TELF: (0243) 251.75.33 - 672.01.65 - (0412) 755.62.07 - (0424) 303.37.40</p>
                    </div>
                  </div>
                  <div className="text-center shrink-0 mx-4">
                    <p className="text-[10px] font-semibold">R.I.F.: J-30913171-0</p>
                    <p className="text-sm font-bold tracking-wide">Guía de Despacho</p>
                    <p className="text-2xl font-bold text-red-600">NUEVA</p>
                  </div>
                  <div className="text-right text-[9px] shrink-0">
                    <div className="border border-black px-3 py-1 mb-1">
                      <p className="font-bold">FECHA DE EMISIÓN</p>
                      <p>{new Date().toLocaleDateString('es-VE')}</p>
                    </div>
                    <div className="border border-black px-3 py-1">
                      <p className="font-bold">FECHA DE VENCIMIENTO</p>
                      <p className="text-slate-400">___/___/______</p>
                    </div>
                  </div>
                </div>

                {/* CLIENTE */}
                <div className="text-[10px] mb-2 space-y-1">
                  <div className="flex items-center">
                    <span className="font-bold w-16">Cliente:</span>
                    <span className="flex-1 border-b border-black mx-1">{clienteSeleccionado?.nombre || ''}</span>
                    <span className="font-bold ml-4">R.I.F.:</span>
                    <span className="border-b border-black w-48 ml-1">{clienteSeleccionado?.rif || ''}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold w-16">Dirección:</span>
                    <span className="flex-1 border-b border-black mx-1">{clienteSeleccionado?.direccion || ''}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold w-16">Teléfonos:</span>
                    <span className="border-b border-black w-36">{clienteSeleccionado?.telefono || ''}</span>
                    <span className="font-bold ml-4">N.I.T.:</span>
                    <span className="border-b border-black w-24 mx-1"></span>
                    <span className="font-bold ml-2">Condiciones:</span>
                    <span className="border-b border-black w-20 mx-1 text-center">Contado</span>
                    <span className="font-bold ml-4">Van:</span>
                    <span className="border-b border-black w-12 mx-1 text-center font-bold">{pedidoSeleccionado ? vanM3 : (Number(cantidadM3) || 0)}</span>
                    <span>M³de</span>
                    <span className="border-b border-black w-12 mx-1 text-center font-bold">{pedidoSeleccionado ? deM3 : '___'}</span>
                    <span>M³</span>
                  </div>
                </div>

                {/* TABLA */}
                <table className="w-full text-[10px] mb-2 border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="border border-black px-2 py-1.5 text-center font-bold w-[8%]">Cant.</th>
                      <th className="border border-black px-2 py-1.5 text-center font-bold w-[22%]">Resistencia (RG)</th>
                      <th className="border border-black px-2 py-1.5 text-center font-bold w-[10%]">ASENT.</th>
                      <th className="border border-black px-2 py-1.5 text-left font-bold">OBSERVACIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productoSeleccionado ? (
                      <tr>
                        <td className="border border-black px-2 py-8 text-center text-sm font-bold">{Number(cantidadM3) || 0}</td>
                        <td className="border border-black px-2 py-8 text-center font-bold">{productoSeleccionado.resistencia || ''}{productoSeleccionado.pulgada ? ` ${productoSeleccionado.pulgada}ST` : ''}</td>
                        <td className="border border-black px-2 py-8 text-center">{productoSeleccionado.pulgada ? `${productoSeleccionado.pulgada}"` : ''}</td>
                        <td className="border border-black px-3 py-4 text-[9px] leading-relaxed">
                          <p>El Concreto suministrado cumple con la Norma COVENIN 633.</p>
                          <p>Cualquier adición de agua va por cuenta y riesgo del Cliente.</p>
                          <p className="font-bold mt-1">ADITIVO WRDA 79</p>
                          <p className="text-right font-bold mt-1">FRACTIL 10%</p>
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={4} className="border border-black px-2 py-8 text-center text-slate-400">Seleccione un producto...</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* ADICIÓN DE AGUA */}
                <div className="flex justify-between text-[9px] mb-2 px-1">
                  <span>Adición de Agua Sugerido por el Dueño <span className="border-b border-dotted border-black min-w-[30px] inline-block">&nbsp;</span> Litros / Adición de Agua Sugerido por el Cliente <span className="border-b border-dotted border-black min-w-[30px] inline-block">&nbsp;</span> Litros</span>
                  <span className="ml-4">Firma ________________</span>
                </div>

                {/* OBRA + CHOFER */}
                <div className="text-[10px] space-y-1 mb-3">
                  <div className="flex items-center">
                    <span className="font-bold">OBRA:</span>
                    <span className="flex-1 border-b border-black ml-1">{watch('obra') || ''}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold">CHOFER:</span>
                    <span className="border-b border-black w-48 ml-1">{chofer || ''}</span>
                    <span className="font-bold ml-6">HORA DE SALIDA:</span>
                    <span className="border-b border-black w-24 ml-1 font-bold">{horaSalida}</span>
                    <span className="font-bold ml-6">HORA DE LLEGADA:</span>
                    <span className="border-b border-black w-24 ml-1"></span>
                  </div>
                </div>

                {/* RECIBIDO POR */}
                <div className="flex items-start justify-between border-t border-black pt-2 mb-2">
                  <div className="text-[10px] font-bold">RECIBIDO POR:</div>
                  <div className="flex gap-6 text-[9px]">
                    <div className="w-28"><span className="font-bold">Nombre:</span><span className="border-b border-black ml-1 inline-block w-16">&nbsp;</span></div>
                    <div className="w-24"><span className="font-bold">Firma:</span><span className="border-b border-black ml-1 inline-block w-12">&nbsp;</span></div>
                    <div className="w-24"><span className="font-bold">Fecha:</span><span className="border-b border-black ml-1 inline-block w-12">&nbsp;</span></div>
                    <div className="w-20"><span className="font-bold">Hora:</span><span className="border-b border-black ml-1 inline-block w-10">&nbsp;</span></div>
                  </div>
                </div>

                {/* CONTROL + FOOTER */}
                <div className="flex justify-between items-center border-t border-black pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">N° DE CONTROL:</span>
                    <span className="text-xl font-bold text-red-600">00-NUEVA</span>
                  </div>
                  <span className="text-[10px] font-bold text-red-600">ORIGINAL CLIENTE - SIN DERECHO A CREDITO FISCAL</span>
                </div>
              </>
            ) : (
              /* ===== PREMEZCLADO - GUÍA DE DESPACHO ===== */
              <>
                <div className="flex justify-between items-start mb-4 pb-3 border-b-2 border-slate-800">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-wide">CONCRETO PREMEZCLADO</h2>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Guía de Despacho</p>
                    <p className="text-sm font-bold text-red-600 mt-0.5">Nº NUEVA</p>
                  </div>
                  <div className="text-right text-[10px] space-y-1">
                    <div className="border border-slate-400 px-2 py-1">
                      <span className="font-semibold text-slate-500">Fecha de Emisión:</span>{' '}
                      <span className="text-slate-700">{new Date().toLocaleDateString('es-VE')}</span>
                    </div>
                    <div className="border border-slate-400 px-2 py-1">
                      <span className="font-semibold text-slate-500">Fecha de Vencimiento:</span>{' '}
                      <span className="text-slate-400">___/___/______</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3 text-xs">
                  <div className="flex gap-2">
                    <span className="font-semibold w-20 shrink-0">Cliente:</span>
                    <span className="flex-1 border-b border-slate-400">{clienteSeleccionado?.nombre || ''}</span>
                    <span className="font-semibold w-8 shrink-0">RIF:</span>
                    <span className="w-40 border-b border-slate-400">{clienteSeleccionado?.rif || ''}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold w-20 shrink-0">Dirección:</span>
                    <span className="flex-1 border-b border-slate-400">{clienteSeleccionado?.direccion || ''}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold w-20 shrink-0">Teléfono:</span>
                    <span className="flex-1 border-b border-slate-400">{clienteSeleccionado?.telefono || ''}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 border-y border-slate-400 mb-3 text-xs">
                  <span className="font-semibold">CONDICIONES</span>
                  <span className="font-bold text-sm">
                    VAN: {pedidoSeleccionado ? vanM3 : (Number(cantidadM3) || 0)} M³ DE{' '}
                    {pedidoSeleccionado ? deM3 : <span className="border-b border-slate-400 min-w-[40px] inline-block">&nbsp;&nbsp;&nbsp;&nbsp;</span>}{' '}
                    M³
                  </span>
                </div>

                <div className="border border-slate-400 mb-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-400 px-2 py-2 text-center font-bold w-[8%]">CANT.</th>
                        <th className="border border-slate-400 px-2 py-2 text-center font-bold w-[18%]">RESISTENCIA (RC)</th>
                        <th className="border border-slate-400 px-2 py-2 text-center font-bold w-[10%]">ASENT.</th>
                        <th className="border border-slate-400 px-2 py-2 text-left font-bold">OBSERVACIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productoSeleccionado ? (
                        <tr>
                          <td className="border border-slate-400 px-2 py-6 text-center">{Number(cantidadM3) || 0}</td>
                          <td className="border border-slate-400 px-2 py-6 text-center">{productoSeleccionado.resistencia || ''}</td>
                          <td className="border border-slate-400 px-2 py-6 text-center">{productoSeleccionado.pulgada ? `${productoSeleccionado.pulgada}"` : ''}</td>
                          <td className="border border-slate-400 px-2 py-6 min-h-[80px]">&nbsp;</td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={4} className="border border-slate-400 px-2 py-8 text-center text-slate-400">Seleccione un producto...</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 mb-3 px-1">
                  <span>Adición de agua sugerido por el dueño <span className="border-b border-dotted border-slate-400 min-w-[40px] inline-block">&nbsp;</span> litros</span>
                  <span>/ Adición de agua sugerido por el cliente <span className="border-b border-dotted border-slate-400 min-w-[40px] inline-block">&nbsp;</span> Litros.</span>
                  <span>Firma:</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex gap-2">
                    <span className="font-semibold w-16 shrink-0">OBRA:</span>
                    <span className="flex-1 border-b border-slate-400"></span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold w-16 shrink-0">CHOFER:</span>
                    <span className="w-48 border-b border-slate-400">{chofer || ''}</span>
                    <span className="font-semibold shrink-0">Hora salida:</span>
                    <span className="w-20 border-b border-slate-400 font-semibold">{horaSalida}</span>
                    <span className="font-semibold shrink-0">Hora llegada:</span>
                    <span className="w-20 border-b border-slate-400"></span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold shrink-0">N° UNIDAD:</span>
                    <span className="w-28 border-b border-slate-400">{unidadSeleccionada?.tipo || ''}</span>
                    <span className="font-semibold shrink-0">NOMBRE:</span>
                    <span className="flex-1 border-b border-slate-400"></span>
                  </div>
                </div>

                <div className="flex justify-between mt-6 pt-4 border-t border-slate-300">
                  <div className="w-1/3 text-center">
                    <div className="mt-8 border-t border-slate-600 pt-1 text-[10px] font-semibold">Recibido Por:</div>
                  </div>
                  <div className="w-1/3 text-center">
                    <div className="mt-8 border-t border-slate-600 pt-1 text-[10px] font-semibold">Firma:</div>
                  </div>
                  <div className="w-1/3 text-center">
                    <div className="mt-8 border-t border-slate-600 pt-1 text-[10px] font-semibold">Fecha / Hora:</div>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
