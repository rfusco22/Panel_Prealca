'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, AlertCircle, CheckCircle2, Loader2, Eye, Printer } from 'lucide-react';
import { calculateIVA, calculateRetention } from '@/lib/calculations';
import { printDocument, generateFacturaHtml } from '@/lib/document-templates';
import { formatearFecha } from '@/lib/fecha';

export interface FacturaInitialData {
  id: number;
  clienteId: string;
  guiaDespachoId?: string;
  tipoPago: string;
  metodoPago: string;
  comprobanteRetencion?: string;
  subtotal: number;
  fechaVencimiento?: string;
}

interface FacturaFormProps {
  initialData?: FacturaInitialData | null;
}

function formatBs(value: number) {
  return value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function FacturaForm({ initialData }: FacturaFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [tipoPago, setTipoPago] = useState<string>(initialData?.tipoPago || '');
  const [metodoPago, setMetodoPago] = useState<string>(initialData?.metodoPago || '');
  const [bancoId, setBancoId] = useState<string>('');
  const [numeroReferencia, setNumeroReferencia] = useState<string>('');
  const [bancos, setBancos] = useState<any[]>([]);
  const [esContribuyenteEspecial, setEsContribuyenteEspecial] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<string>(initialData?.clienteId || '');
  const [isPrinting, setIsPrinting] = useState(false);
  const [comprobanteRetencion, setComprobanteRetencion] = useState(initialData?.comprobanteRetencion || '');
  const [vence, setVence] = useState(initialData?.fechaVencimiento || '');
  const [guiaId, setGuiaId] = useState(initialData?.guiaDespachoId || '');
  const [guias, setGuias] = useState<any[]>([]);
  const [subtotal, setSubtotal] = useState<number>(initialData?.subtotal || 0);

  const totalIva = calculateIVA(subtotal);
  // Antes se calculaba sobre el subtotal completo (75% de todo el monto) en vez
  // de sobre el IVA, lo que retenia muchisimo mas de lo que corresponde: la
  // retencion de IVA a contribuyentes especiales es un porcentaje del IVA, no
  // del subtotal.
  const ivaRetenido = esContribuyenteEspecial ? calculateRetention(totalIva) : 0;
  const totalPagar = subtotal + totalIva - ivaRetenido;

  const cliente = clientes.find((c: any) => String(c.id) === selectedClienteId);
  const vendedor = cliente?.vendedor || '';
  const guiaSeleccionada = guias.find((g: any) => String(g.id) === String(guiaId));

  useEffect(() => {
    fetch('/api/clientes').then(r => r.json()).then(d => {
      if (d.success) setClientes(d.clientes);
    }).catch(() => {});
    fetch('/api/bancos').then(r => r.json()).then(d => {
      if (d.success) setBancos(d.bancos || []);
    }).catch(() => {});
    fetch('/api/guia-despacho').then(r => r.json()).then(d => {
      if (d.success) setGuias(d.guias || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedClienteId) {
      const c = clientes.find((cl: any) => String(cl.id) === selectedClienteId);
      if (c) setEsContribuyenteEspecial(!!c.es_contribuyente_especial);
    }
  }, [selectedClienteId, clientes]);

  // Un solo item sintetico para la vista previa/impresion: la tabla `facturas`
  // no guarda un desglose de items, solo un monto total. Si hay una guia de
  // despacho asociada se usa su producto como descripcion; si no, un renglon
  // generico con el monto cargado a mano.
  const itemsPreview = [{
    codigo: '',
    descripcion: guiaSeleccionada?.productoNombre || 'Concreto / Servicios prestados',
    cantidad: guiaSeleccionada ? Number(guiaSeleccionada.cantidadM3) : 1,
    precioUnitario: guiaSeleccionada && Number(guiaSeleccionada.cantidadM3) > 0 ? subtotal / Number(guiaSeleccionada.cantidadM3) : subtotal,
    subtotalItem: subtotal,
  }];

  const handlePrint = () => {
    setIsPrinting(true);
    printDocument(generateFacturaHtml({
      facturaNumber: isEditing ? `F-${initialData!.id}` : 'NUEVA',
      fecha: new Date().toISOString(),
      vence: vence || undefined,
      clienteNombre: cliente?.nombre || '—',
      clienteRif: cliente?.rif || '—',
      clienteDireccion: cliente?.direccion || '—',
      vendedor,
      formaPago: tipoPago || '—',
      nota: guiaSeleccionada ? `GD-${guiaSeleccionada.id}` : undefined,
      items: itemsPreview,
      total: totalPagar,
      subtotalGeneral: subtotal,
      ivaRetenido,
      totalIva,
      esContribuyenteEspecial,
    }));
    setTimeout(() => setIsPrinting(false), 500);
  };

  const handleSubmit = async () => {
    if (!selectedClienteId) { setError('Debe seleccionar un cliente'); return; }
    if (!tipoPago) { setError('Debe seleccionar un tipo de pago'); return; }
    if (!Number.isFinite(subtotal) || subtotal <= 0) { setError('Ingrese un monto (subtotal) mayor a 0'); return; }

    setError(null); setIsLoading(true);
    try {
      const payload = {
        ...(isEditing ? { id: initialData!.id } : {}),
        clienteId: selectedClienteId,
        guiaDespachoId: guiaId || null,
        // La columna forma_pago es un ENUM que solo acepta "Contado"/"Crédito"
        // (los mismos dos valores del <select> Tipo de Pago): combinarlo con el
        // metodo de pago ("Contado - Efectivo") truncaba el insert y tiraba
        // "Data truncated for column 'forma_pago'". El metodo de pago queda solo
        // en el documento impreso, igual que el banco y el numero de referencia.
        formaPago: tipoPago,
        comprobanteRetencion: comprobanteRetencion || null,
        subtotal,
        fechaVencimiento: vence || null,
      };
      const res = await fetch('/api/facturas', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(isEditing ? 'Factura actualizada exitosamente' : 'Factura creada exitosamente');
        setTimeout(() => router.push(isEditing ? '/registro/facturas' : '/registro/ingresos'), 1500);
      } else { throw new Error(data.error || 'Error al guardar la factura'); }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la factura');
    } finally { setIsLoading(false); }
  };

  const inputCls = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-400 bg-white transition-all";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-160px)]">
      {/* FORMULARIO */}
      <div className="p-8 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="p-2.5 bg-purple-50 rounded-xl"><FileText className="w-6 h-6 text-purple-600" /></div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{isEditing ? 'Editar Factura' : 'Generar Factura'}</h2>
              <p className="text-sm text-slate-500">{isEditing ? 'Actualice los datos de la factura' : 'Configure los datos para generar la factura'}</p>
            </div>
          </div>

          {error && <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-800 p-4 rounded-xl"><AlertCircle size={20} className="text-red-500 shrink-0" /><p className="text-sm font-medium">{error}</p></div>}
          {success && <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl"><CheckCircle2 size={20} className="text-emerald-500 shrink-0" /><p className="text-sm font-medium">{success}</p></div>}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-sm font-bold shrink-0">1</span>
              <h3 className="text-lg font-semibold text-slate-900">Datos del Cliente</h3>
            </div>
            <div>
              <label className={labelCls}>Cliente</label>
              <select value={selectedClienteId} onChange={e => setSelectedClienteId(e.target.value)} className={inputCls}>
                <option value="">Seleccionar cliente...</option>
                {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            {vendedor && (
              <div>
                <label className={labelCls}>Vendedor</label>
                <input type="text" value={vendedor} readOnly className={inputCls + ' bg-slate-50'} />
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-sm font-bold shrink-0">2</span>
              <h3 className="text-lg font-semibold text-slate-900">Datos de la Factura</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Monto a Facturar (Bs)</label>
                <input
                  type="number" step="0.01" min="0" placeholder="0.00"
                  value={subtotal || ''}
                  onChange={e => setSubtotal(parseFloat(e.target.value) || 0)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Fecha de Vencimiento</label>
                <input type="date" value={vence} onChange={e => setVence(e.target.value)} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Guía de Despacho (opcional)</label>
                <select value={guiaId} onChange={e => setGuiaId(e.target.value)} className={inputCls}>
                  <option value="">Sin guía asociada</option>
                  {guias.map((g: any) => (
                    <option key={g.id} value={g.id}>GD-{g.id} — {g.clienteNombre} — {Number(g.cantidadM3).toFixed(2)} M³</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-sm font-bold shrink-0">3</span>
              <h3 className="text-lg font-semibold text-slate-900">Forma de Pago</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Tipo de Pago</label>
                <select value={tipoPago} onChange={e => setTipoPago(e.target.value)} className={inputCls}>
                  <option value="">Seleccionar...</option>
                  <option value="Contado">Contado</option>
                  <option value="Crédito">Crédito</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Método de Pago</label>
                <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)} className={inputCls}>
                  <option value="">Seleccionar método...</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Punto de Venta">Punto de Venta</option>
                  <option value="Zelle">Zelle</option>
                  <option value="Criptomonedas">Criptomonedas</option>
                </select>
              </div>
              {metodoPago === 'Transferencia' && (
                <>
                  <div>
                    <label className={labelCls}>Banco</label>
                    <select value={bancoId} onChange={e => setBancoId(e.target.value)} className={inputCls}>
                      <option value="">Seleccionar banco...</option>
                      {bancos.map((b: any) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>N° Referencia</label>
                    <input type="text" value={numeroReferencia} onChange={e => setNumeroReferencia(e.target.value)} placeholder="Número de referencia" className={inputCls} />
                  </div>
                </>
              )}
              {esContribuyenteEspecial && (
                <div className="sm:col-span-2">
                  <label className={labelCls}>Comprobante de Retención (opcional)</label>
                  <input type="text" value={comprobanteRetencion} onChange={e => setComprobanteRetencion(e.target.value)} placeholder="N° de comprobante que envía el cliente" className={inputCls} />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-sm font-bold shrink-0">4</span>
              <h3 className="text-lg font-semibold text-slate-900">Resumen</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Subtotal</p>
                <p className="text-lg font-bold text-slate-900">{formatBs(subtotal)} Bs</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">IVA 16%</p>
                <p className="text-lg font-bold text-blue-600">{formatBs(totalIva)} Bs</p>
              </div>
              {esContribuyenteEspecial && <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Retención 75% IVA</p>
                <p className="text-lg font-bold text-red-600">- {formatBs(ivaRetenido)} Bs</p>
              </div>}
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5">
              <div className="flex justify-between items-center">
                <p className="text-base font-bold text-blue-800">TOTAL A PAGAR</p>
                <p className="text-2xl font-black text-blue-900">{formatBs(totalPagar)} Bs</p>
              </div>
            </div>
            {esContribuyenteEspecial && (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertCircle size={18} className="text-amber-600 shrink-0" />
                <p className="text-sm font-medium text-amber-800">
                  Este cliente está marcado como <strong>Contribuyente Especial</strong> — se aplicará retención del 75% sobre el IVA.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => router.push('/registro/facturas')} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-200">Cancelar</button>
            <button onClick={handlePrint} type="button" disabled={isPrinting} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              {isPrinting ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
              {isPrinting ? 'Imprimiendo...' : 'Imprimir'}
            </button>
            <button onClick={handleSubmit} disabled={isLoading} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-700 active:scale-[0.98] text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              {isLoading ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
              {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Generar Factura'}
            </button>
          </div>
        </div>
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
          <div className="p-8 text-sm text-slate-800 leading-relaxed" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Top header: Logo + Factura number */}
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-3">
                <img src="/logo.jpeg" alt="Prealca Logo" className="w-20 h-auto" />
                <div>
                  <p className="text-base font-bold text-slate-900">PREALCA</p>
                  <p className="text-xs text-slate-500">RIF.: J-30913171-0</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">FACTURA <span className="font-normal text-base">{isEditing ? `F-${initialData!.id}` : 'NUEVA'}</span></p>
                <p className="text-xs">Fecha: {formatearFecha(new Date())}</p>
                {vence && <p className="text-xs">Vence: {formatearFecha(vence + 'T00:00:00')}</p>}
              </div>
            </div>

            {/* Client info */}
            <div className="mb-8">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-0.5 font-bold text-xs w-24">Cliente:</td>
                    <td className="py-0.5 text-xs">{cliente?.nombre || '—'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-bold text-xs">Dirección:</td>
                    <td className="py-0.5 text-xs">{cliente?.direccion || '—'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-bold text-xs">Rif:</td>
                    <td className="py-0.5 text-xs">{cliente?.rif || '—'}</td>
                  </tr>
                  {vendedor && (
                    <tr>
                      <td className="py-0.5 font-bold text-xs">Vendedor:</td>
                      <td className="py-0.5 text-xs">{vendedor}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Items table */}
            <table className="w-full border-collapse mb-10">
              <thead>
                <tr style={{ background: '#d9d9d9' }}>
                  <th className="px-2 py-2 text-left text-xs font-bold border-b-2 border-gray-400">Codigo</th>
                  <th className="px-2 py-2 text-left text-xs font-bold border-b-2 border-gray-400">Descripcion</th>
                  <th className="px-2 py-2 text-center text-xs font-bold border-b-2 border-gray-400">Cantidad</th>
                  <th className="px-2 py-2 text-right text-xs font-bold border-b-2 border-gray-400">Precio Unitario</th>
                  <th className="px-2 py-2 text-right text-xs font-bold border-b-2 border-gray-400">Total</th>
                </tr>
              </thead>
              <tbody>
                {subtotal > 0 ? itemsPreview.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-2 py-2 text-xs border-b border-gray-200"></td>
                    <td className="px-2 py-2 text-xs border-b border-gray-200">{item.descripcion}</td>
                    <td className="px-2 py-2 text-xs text-center border-b border-gray-200">{item.cantidad.toLocaleString('es-VE')}</td>
                    <td className="px-2 py-2 text-xs text-right border-b border-gray-200">{formatBs(item.precioUnitario)}</td>
                    <td className="px-2 py-2 text-xs text-right border-b border-gray-200">{formatBs(item.subtotalItem)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-2 py-8 text-center text-xs text-slate-400 border-b border-gray-200">Ingrese un monto para ver el detalle</td></tr>
                )}
              </tbody>
            </table>

            {/* Bottom section: two columns */}
            <div className="flex border border-gray-800 text-xs">
              {/* Left: Nota + payment details */}
              <div className="flex-1 p-3 border-r border-gray-800 space-y-1">
                <p className="font-semibold">GUIA DE DESPACHO: {guiaSeleccionada ? `GD-${guiaSeleccionada.id}` : '—'}</p>
                <p><strong>TASA OFICIAL (BCV)</strong> —</p>
                <p><strong>FORMA DE PAGO:</strong> {tipoPago || '—'} {metodoPago && `- ${metodoPago}`}</p>
                <p><strong>RET. IVA</strong> Bs.{formatBs(ivaRetenido)}</p>
                <p><strong>POR COBRAR</strong> Bs.{formatBs(totalPagar)}</p>
                <p><strong>TRANSFERENCIA</strong> Bs.{formatBs(0)}</p>
              </div>
              {/* Right: Totals */}
              <div className="w-64">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="py-1 px-3 font-semibold">SUB TOTAL</td>
                      <td className="py-1 px-3 text-right">{formatBs(subtotal)}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-1 px-3 font-semibold">EXCENTO</td>
                      <td className="py-1 px-3 text-right">{formatBs(0)}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-1 px-3 font-semibold">BASE IMPONIBLE</td>
                      <td className="py-1 px-3 text-right">{formatBs(subtotal)}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-1 px-3 font-semibold">I.V.A. 16%</td>
                      <td className="py-1 px-3 text-right">{formatBs(totalIva)}</td>
                    </tr>
                    <tr className="border-b border-gray-300 font-bold">
                      <td className="py-1 px-3 font-bold border-t-2 border-gray-800">TOTAL A PAGAR</td>
                      <td className="py-1 px-3 text-right border-t-2 border-gray-800">{formatBs(totalPagar)}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-1 px-3 font-semibold">B.I. IGTF</td>
                      <td className="py-1 px-3 text-right">{formatBs(0)}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-1 px-3 font-semibold">IGTF 3%</td>
                      <td className="py-1 px-3 text-right">—</td>
                    </tr>
                    <tr className="font-bold">
                      <td className="py-1 px-3 font-bold border-t-2 border-gray-800">TOTAL A PAGAR IGTF</td>
                      <td className="py-1 px-3 text-right border-t-2 border-gray-800">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
