'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileText, CreditCard, AlertCircle, CheckCircle2, Loader2, Eye, Printer, DollarSign } from 'lucide-react';
import { calculateIVA, calculateRetention } from '@/lib/calculations';
import { printDocument, generateFacturaHtml } from '@/lib/document-templates';

interface FacturaFormProps {
  initialData?: {
    clienteId?: string;
    clienteNombre?: string;
    items?: Array<{ nombreMaterial: string; cantidad: number; unidadMedida: string; precioUnitario: number; subtotalItem: number }>;
    total?: number;
    montoRetencion?: number;
    montoIva?: number;
    esContribuyenteEspecial?: boolean;
  };
}

function formatCurrencyBs(value: number) {
  return value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Bs';
}

export function FacturaForm({ initialData }: FacturaFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [tipoPago, setTipoPago] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<string>('');
  const [bancoId, setBancoId] = useState<string>('');
  const [numeroReferencia, setNumeroReferencia] = useState<string>('');
  const [bancos, setBancos] = useState<any[]>([]);
  const [esContribuyenteEspecial, setEsContribuyenteEspecial] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<string>(initialData?.clienteId || '');
  const [isPrinting, setIsPrinting] = useState(false);

  const items = initialData?.items || [];
  const subtotalGeneral = initialData?.total || 0;
  const totalIva = items.reduce((sum, item) => sum + calculateIVA(item.subtotalItem), 0);
  const ivaRetenido = esContribuyenteEspecial ? calculateRetention(subtotalGeneral) : 0;
  const totalPagar = subtotalGeneral + totalIva - ivaRetenido;

  useEffect(() => {
    fetch('/api/clientes').then(r => r.json()).then(d => {
      if (d.success) setClientes(d.clientes);
    }).catch(() => {});
    fetch('/api/bancos').then(r => r.json()).then(d => {
      if (d.success) setBancos(d.bancos || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedClienteId) {
      const cliente = clientes.find((c: any) => String(c.id) === selectedClienteId);
      if (cliente) setEsContribuyenteEspecial(!!cliente.es_contribuyente_especial);
    }
  }, [selectedClienteId, clientes]);

  const handlePrint = () => {
    setIsPrinting(true);
    const cliente = clientes.find((c: any) => String(c.id) === selectedClienteId);
    printDocument(generateFacturaHtml({
      invoiceNumber: 'NUEVA',
      fecha: new Date().toISOString(),
      clienteNombre: cliente?.nombre || initialData?.clienteNombre || '—',
      clienteRif: cliente?.rif || '—',
      clienteDireccion: cliente?.direccion || '—',
      items,
      subtotalGeneral,
      totalIva,
      ivaRetenido,
      totalPagar,
      esContribuyenteEspecial,
      montoRetencionIva: ivaRetenido,
    }));
    setTimeout(() => setIsPrinting(false), 500);
  };

  const handleSubmit = async () => {
    if (!selectedClienteId) { setError('Debe seleccionar un cliente'); return; }
    if (!tipoPago) { setError('Debe seleccionar un tipo de pago'); return; }

    setError(null); setIsLoading(true);
    try {
      const res = await fetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: selectedClienteId,
          clienteNombre: clientes.find((c: any) => String(c.id) === selectedClienteId)?.nombre,
          items, total: totalPagar, tipoPago, metodoPago, bancoId, numeroReferencia,
          montoRetencion: ivaRetenido, montoIva: totalIva, esContribuyenteEspecial,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Factura creada exitosamente');
        setTimeout(() => router.push('/registro/ingresos'), 1500);
      } else { throw new Error(data.error || 'Error al crear factura'); }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear factura');
    } finally { setIsLoading(false); }
  };

  const inputCls = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-400 bg-white transition-all";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5";
  const errorCls = "text-red-500 text-xs mt-1 font-medium flex items-center gap-1";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-160px)]">
      {/* FORMULARIO */}
      <div className="p-8 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="p-2.5 bg-purple-50 rounded-xl"><FileText className="w-6 h-6 text-purple-600" /></div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Generar Factura</h2>
              <p className="text-sm text-slate-500">Configure los datos para generar la factura</p>
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
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-sm font-bold shrink-0">2</span>
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
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-sm font-bold shrink-0">3</span>
              <h3 className="text-lg font-semibold text-slate-900">Resumen de Cálculos</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Subtotal</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrencyBs(subtotalGeneral)}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">IVA 16%</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrencyBs(totalIva)}</p>
              </div>
              {esContribuyenteEspecial && <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Retención 75%</p>
                <p className="text-lg font-bold text-red-600">- {formatCurrencyBs(ivaRetenido)}</p>
              </div>}
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5">
              <div className="flex justify-between items-center">
                <p className="text-base font-bold text-blue-800">TOTAL A PAGAR</p>
                <p className="text-2xl font-black text-blue-900">{formatCurrencyBs(totalPagar)}</p>
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
            <button type="button" onClick={() => window.history.back()} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-200">Cancelar</button>
            <button onClick={handlePrint} type="button" disabled={isPrinting} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              {isPrinting ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
              {isPrinting ? 'Imprimiendo...' : 'Imprimir'}
            </button>
            <button onClick={handleSubmit} disabled={isLoading} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-700 active:scale-[0.98] text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              {isLoading ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
              {isLoading ? 'Guardando...' : 'Generar Factura'}
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
            <h4 className="text-center font-bold text-base text-slate-900 mb-4 tracking-wide">FACTURA</h4>
            <div className="flex justify-between items-center mb-5">
              <p className="text-xs text-slate-500"><span className="font-semibold">N°:</span> NUEVA</p>
              <p className="text-xs text-slate-500"><span className="font-semibold">Fecha:</span> {new Date().toLocaleDateString('es-VE')}</p>
            </div>

            <div className="mb-4 space-y-1.5">
              <p className="text-sm"><strong>CLIENTE:</strong> {clientes.find((c: any) => String(c.id) === selectedClienteId)?.nombre || initialData?.clienteNombre || '—'}</p>
              <p className="text-sm"><strong>R.I.F./C.I.:</strong> {clientes.find((c: any) => String(c.id) === selectedClienteId)?.rif || '—'}</p>
              <p className="text-sm"><strong>Dirección:</strong> {clientes.find((c: any) => String(c.id) === selectedClienteId)?.direccion || '—'}</p>
            </div>

            <table className="w-full border-collapse mb-5 text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-3 py-2.5 text-left font-bold text-slate-900">Descripción</th>
                  <th className="border border-slate-300 px-3 py-2.5 text-right font-bold text-slate-900">Cantidad</th>
                  <th className="border border-slate-300 px-3 py-2.5 text-left font-bold text-slate-900">Unidad</th>
                  <th className="border border-slate-300 px-3 py-2.5 text-right font-bold text-slate-900">Precio Unit.</th>
                  <th className="border border-slate-300 px-3 py-2.5 text-right font-bold text-slate-900">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-300 px-3 py-2.5">{item.nombreMaterial}</td>
                    <td className="border border-slate-300 px-3 py-2.5 text-right">{item.cantidad.toLocaleString('es-VE')}</td>
                    <td className="border border-slate-300 px-3 py-2.5">{item.unidadMedida}</td>
                    <td className="border border-slate-300 px-3 py-2.5 text-right">{formatCurrencyBs(item.precioUnitario)}</td>
                    <td className="border border-slate-300 px-3 py-2.5 text-right">{formatCurrencyBs(item.subtotalItem)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="border border-slate-300 px-3 py-8 text-center text-slate-400">Sin items para mostrar</td></tr>
                )}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-72 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span><strong>SUB TOTAL:</strong></span>
                  <span>{formatCurrencyBs(subtotalGeneral)}</span>
                </div>
                <div className="flex justify-between">
                  <span><strong>I.V.A. 16%:</strong></span>
                  <span>{formatCurrencyBs(totalIva)}</span>
                </div>
                {esContribuyenteEspecial && <div className="flex justify-between">
                  <span><strong>RETIENCION I.V.A 75%:</strong></span>
                  <span>-{formatCurrencyBs(ivaRetenido)}</span>
                </div>}
                <div className="flex justify-between font-black text-base border-t border-slate-200 pt-2">
                  <span>TOTAL:</span>
                  <span>{formatCurrencyBs(totalPagar)}</span>
                </div>
              </div>
            </div>

            {tipoPago && (
              <div className="mt-4 pt-3 border-t border-slate-200 space-y-1.5 text-xs">
                <p><strong>TIPO PAGO:</strong> {tipoPago} {metodoPago && `- ${metodoPago}`}</p>
                {bancoId && bancos.find((b: any) => String(b.id) === bancoId) && (
                  <p><strong>BANCO:</strong> {bancos.find((b: any) => String(b.id) === bancoId)?.nombre}</p>
                )}
                {numeroReferencia && <p><strong>N° REFERENCIA:</strong> {numeroReferencia}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
