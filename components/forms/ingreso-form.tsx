'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, TrendingUp, Loader2, Upload, X, Paperclip } from 'lucide-react';

interface IngresoFormProps {
  onAdd: (data: any) => void;
  onClose?: () => void;
}

export function IngresoForm({ onAdd, onClose }: IngresoFormProps) {
  const [tasaCambio, setTasaCambio] = useState<number>(0);
  const [cargandoTasa, setCargandoTasa] = useState(true);
  const [errorTasa, setErrorTasa] = useState<string | null>(null);
  const [tipoComision, setTipoComision] = useState<'PORCENTAJE' | 'MONTO'>('PORCENTAJE');
  const [showSuccess, setShowSuccess] = useState(false);

  const [listaBancos, setListaBancos] = useState<any[]>([]);
  const [listaClientes, setListaClientes] = useState<any[]>([]);
  const [listaVendedores, setListaVendedores] = useState<string[]>([]);
  const [listaProductos, setListaProductos] = useState<any[]>([]);
  const [clienteId, setClienteId] = useState('');

  const [bancoId, setBancoId] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [rif, setRif] = useState('');
  const [vendedor, setVendedor] = useState('');
  const [valorComision, setValorComision] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [m3, setM3] = useState('');
  const [resistencia, setResistencia] = useState('');
  const [precioBs, setPrecioBs] = useState('');
  const [precioUsd, setPrecioUsd] = useState('');
  const [monedaEntrada, setMonedaEntrada] = useState<'BS' | 'USD'>('BS');
  const [aplicaIva, setAplicaIva] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState('FACTURA');
  const [referencia, setReferencia] = useState('');
  const [comprobantes, setComprobantes] = useState<{ name: string; url: string }[]>([]);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [bcvRes, selectRes, bancosRes] = await Promise.all([
          fetch('/api/bcv'),
          fetch('/api/clientes/select'),
          fetch('/api/bancos/select'),
        ]);
        const bcvData = await bcvRes.json();
        if (bcvData.tasa) setTasaCambio(bcvData.tasa);
        else setErrorTasa('No se pudo obtener la tasa');

        const selectData = await selectRes.json();
        setListaClientes(selectData.clientes || []);
        setListaVendedores(selectData.vendedores || []);
        setListaProductos(selectData.productos || []);

        const bancosData = await bancosRes.json();
        setListaBancos(Array.isArray(bancosData) ? bancosData : []);
      } catch { setErrorTasa('No se pudo obtener datos iniciales'); }
      setCargandoTasa(false);
    };
    fetchInitial();
  }, []);

  const precioBsNum = monedaEntrada === 'BS' ? (parseFloat(precioBs) || 0) : (parseFloat(precioUsd) || 0) * tasaCambio;
  const precioUsdNum = monedaEntrada === 'USD' ? (parseFloat(precioUsd) || 0) : (parseFloat(precioBs) || 0) / (tasaCambio || 1);
  const ivaBs = aplicaIva ? precioBsNum * 0.16 : 0;
  const ivaUsd = aplicaIva ? precioUsdNum * 0.16 : 0;
  const totalBs = precioBsNum + ivaBs;
  const totalUsd = precioUsdNum + ivaUsd;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setComprobantes(prev => [...prev, { name: file.name, url: ev.target?.result as string }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeComprobante = (idx: number) => {
    setComprobantes(prev => prev.filter((_, i) => i !== idx));
  };

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bancoId || !clienteId || !referencia) return;

    const bancoSeleccionado = listaBancos.find((b: any) => b.id === Number(bancoId));
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await onAdd({
        banco: bancoSeleccionado?.nombreBanco || '',
        bancoId: Number(bancoId), nombreCliente, rif, vendedor, descripcion,
        clienteId: Number(clienteId),
        m3: parseFloat(m3) || 0,
        resistencia,
        precioBs: precioBsNum,
        precioDivisa: totalUsd,
        tasaCambio,
        aplicaIva,
        montoIva: ivaBs,
        totalBs,
        tipoDocumento,
        comision_porcentaje: tipoComision === 'PORCENTAJE' ? parseFloat(valorComision) || null : null,
        comision_monto: tipoComision === 'MONTO' ? parseFloat(valorComision) || null : null,
        referencia,
        comprobantes,
      });

      setShowSuccess(true);
      setTimeout(() => {
        setBancoId(''); setClienteId(''); setNombreCliente(''); setRif(''); setVendedor('');
        setValorComision(''); setDescripcion(''); setM3(''); setResistencia('');
        setPrecioBs(''); setPrecioUsd(''); setMonedaEntrada('BS');
        setAplicaIva(false); setTipoDocumento('FACTURA');
        setReferencia(''); setComprobantes([]); setShowSuccess(false);
      }, 1500);
    } catch (err: any) {
      setSubmitError(err?.message || 'Error al guardar el ingreso');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-300 bg-white transition-all";
  const labelCls = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full relative overflow-hidden">
      {showSuccess && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center rounded-2xl">
          <div className="bg-emerald-100 text-emerald-500 p-4 rounded-full mb-5 animate-bounce">
            <CheckCircle2 size={56} strokeWidth={2.5} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">¡Ingreso Registrado!</h3>
          <p className="text-slate-500 text-sm font-medium text-center px-10">Los datos se han guardado correctamente.</p>
        </div>
      )}

      <div className="p-6 space-y-5 flex-1 flex flex-col overflow-y-auto">
        {/* Tasa BCV */}
        <div className={`flex items-center justify-between py-2.5 px-4 rounded-lg border shadow-sm ${errorTasa ? 'bg-red-50 border-red-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
          <div className="flex items-center gap-2.5">
            <TrendingUp size={18} className={errorTasa ? 'text-red-500' : 'text-emerald-500'} />
            <span className="text-xs font-bold text-slate-800">Tasa BCV</span>
          </div>
          <span className="text-sm font-black text-slate-900">Bs. {tasaCambio || '0.00'}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* COLUMNA IZQUIERDA */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-slate-200 flex items-center justify-center text-slate-600 text-[10px]">1</span> Datos Bancarios
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Banco *</label>
                <select value={bancoId} onChange={e => setBancoId(e.target.value)} required className={inputCls}>
                  <option value="">Seleccione...</option>
                  {listaBancos.map((b: any) => {
                    const ultimos4 = (b.numeroCuenta || '').slice(-4);
                    return <option key={b.id} value={b.id}>{b.nombreBanco}{ultimos4 ? ` *${ultimos4}` : ''}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className={labelCls}>Referencia *</label>
                <input type="text" value={referencia} onChange={e => setReferencia(e.target.value)} required className={inputCls} placeholder="N° referencia" />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className={labelCls}>Monto</label>
                <div className="flex bg-slate-200/60 p-0.5 rounded border border-slate-200">
                  <button type="button" onClick={() => setMonedaEntrada('BS')} className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${monedaEntrada === 'BS' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Bs</button>
                  <button type="button" onClick={() => setMonedaEntrada('USD')} className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${monedaEntrada === 'USD' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>$</button>
                </div>
              </div>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className={labelCls}>{monedaEntrada === 'BS' ? 'Monto (Bs) *' : 'Monto ($) *'}</label>
                  <input
                    type="number" step="0.01" required
                    value={monedaEntrada === 'BS' ? precioBs : precioUsd}
                    onChange={e => monedaEntrada === 'BS' ? setPrecioBs(e.target.value) : setPrecioUsd(e.target.value)}
                    className={inputCls} placeholder="0.00"
                  />
                </div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <input type="checkbox" id="aplicaIva" checked={aplicaIva} onChange={e => setAplicaIva(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer" />
                  <label htmlFor="aplicaIva" className="text-xs font-bold text-slate-700 cursor-pointer select-none">+ IVA</label>
                </div>
              </div>
              {aplicaIva && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => setTipoDocumento('FACTURA')} className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${tipoDocumento === 'FACTURA' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>Factura</button>
                  <button type="button" onClick={() => setTipoDocumento('ANTICIPO')} className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${tipoDocumento === 'ANTICIPO' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>Anticipo</button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div>
                  <label className={labelCls}>Total (Bs)</label>
                  <input type="text" readOnly value={totalBs.toFixed(2)} className={`${inputCls} bg-slate-50 cursor-not-allowed font-bold`} />
                </div>
                <div>
                  <label className={labelCls}>Total ($)</label>
                  <input type="text" readOnly value={totalUsd.toFixed(4)} className={`${inputCls} bg-slate-50 cursor-not-allowed font-mono text-emerald-700 font-bold`} />
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Descripción</label>
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} className={`${inputCls} resize-none h-20`} placeholder="Detalles adicionales..." />
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-slate-200 flex items-center justify-center text-slate-600 text-[10px]">2</span> Cliente y Operación
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nombre Cliente *</label>
                <select
                  value={clienteId}
                  onChange={e => {
                    const id = e.target.value;
                    setClienteId(id);
                    const c = listaClientes.find((cl: any) => cl.id === Number(id));
                    if (c) { setNombreCliente(c.nombre); setRif(c.rif || ''); if (c.vendedor) setVendedor(c.vendedor); }
                    else { setNombreCliente(''); setRif(''); }
                  }}
                  required className={inputCls}
                >
                  <option value="">Seleccione cliente...</option>
                  {listaClientes.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>RIF / Cédula</label>
                <input type="text" value={rif} onChange={e => setRif(e.target.value)} className={inputCls} placeholder="RIF" readOnly />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Vendedor</label>
                <select value={vendedor} onChange={e => setVendedor(e.target.value)} className={inputCls}>
                  <option value="">Seleccione vendedor...</option>
                  {listaVendedores.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls}>Comisión</label>
                  <div className="flex bg-slate-200/60 p-0.5 rounded border border-slate-200">
                    <button type="button" onClick={() => setTipoComision('PORCENTAJE')} className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-all ${tipoComision === 'PORCENTAJE' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>%</button>
                    <button type="button" onClick={() => setTipoComision('MONTO')} className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-all ${tipoComision === 'MONTO' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>$</button>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-bold text-sm">{tipoComision === 'PORCENTAJE' ? '%' : '$'}</span>
                  </div>
                  <input type="number" step="0.01" value={valorComision} onChange={e => setValorComision(e.target.value)} className={`${inputCls} pl-7`} placeholder="0.00" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Volumen (M³)</label>
                <input type="number" step="0.01" value={m3} onChange={e => setM3(e.target.value)} className={inputCls} placeholder="Opcional" />
              </div>
              <div>
                <label className={labelCls}>Resistencia</label>
                <select value={resistencia} onChange={e => setResistencia(e.target.value)} className={inputCls}>
                  <option value="">Seleccione...</option>
                  {listaProductos.map((p: any) => <option key={p.id} value={p.resistencia}>{p.resistencia} — {p.pulgada} ({p.unidad})</option>)}
                </select>
              </div>
            </div>

            {/* Comprobantes */}
            <div>
              <label className={labelCls}>Comprobante de Pago</label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center hover:border-slate-400 transition cursor-pointer" onClick={() => document.getElementById('comprobante-ingreso')?.click()}>
                <Upload size={20} className="mx-auto text-slate-400 mb-1" />
                <p className="text-xs text-slate-500">Adjuntar comprobante</p>
                <input id="comprobante-ingreso" type="file" accept="image/*,.pdf" multiple className="hidden" onChange={handleFileUpload} />
              </div>
              {comprobantes.length > 0 && (
                <div className="mt-2 space-y-1">
                  {comprobantes.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-1.5 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate text-slate-700">{c.name}</span>
                      </div>
                      <button type="button" onClick={() => removeComprobante(i)} className="text-red-400 hover:text-red-600 shrink-0 ml-2"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0 space-y-3">
        {submitError && (
          <div className="flex items-center gap-2 text-red-600 text-xs font-semibold bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <AlertCircle size={14} /> {submitError}
          </div>
        )}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-700 hover:bg-slate-200 bg-slate-100 border border-slate-200 rounded-lg px-5 py-2 text-sm font-medium transition-colors w-full sm:w-auto">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-6 py-2 shadow-md transition-all text-sm font-semibold flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed">
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Registrar Ingreso
          </button>
        </div>
      </div>
    </form>
  );
}
