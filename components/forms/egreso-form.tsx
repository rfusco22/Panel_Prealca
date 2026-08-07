'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, TrendingDown, Loader2, Upload, X, Paperclip } from 'lucide-react';

interface EgresoFormProps {
  onAdd: (data: any) => void;
  onClose?: () => void;
}

const CLASIFICACIONES = [
  { value: 'Mantenimiento', label: 'Mantenimiento' },
  { value: 'Produccion', label: 'Producción' },
  { value: 'Servicios', label: 'Servicios' },
  { value: 'Gasto de Personal', label: 'Gasto de Personal' },
  { value: 'Impuestos y Contribuciones', label: 'Impuestos y Contribuciones' },
];

const SUB_CATEGORIAS: Record<string, { value: string; label: string; extra?: string; unidad?: string; precioLabel?: string }[]> = {
  Mantenimiento: [
    { value: 'Repuesto', label: 'Repuesto', extra: 'Camino' },
    { value: 'Lubricante', label: 'Lubricante', extra: 'Camino' },
    { value: 'Cauchos', label: 'Cauchos', extra: 'Camino' },
    { value: 'Latoneria y Pintura', label: 'Latonería y Pintura', extra: 'Camión' },
    { value: 'Oficina y Planta', label: 'Oficina y Planta' },
  ],
  Produccion: [
    { value: 'Arena', label: 'Arena', unidad: 'M³', precioLabel: 'Precio por M³' },
    { value: 'Piedra', label: 'Piedra', unidad: 'M³', precioLabel: 'Precio por M³' },
    { value: 'Cemento', label: 'Cemento', unidad: 'Tonelada', precioLabel: 'Precio por Tonelada' },
    { value: 'Aditivo', label: 'Aditivo', unidad: 'Litro', precioLabel: 'Precio por Litro' },
    { value: 'Fibra', label: 'Fibra', unidad: 'Bolsa', precioLabel: 'Precio por Bolsa' },
    { value: 'Flete', label: 'Flete', unidad: 'M³', precioLabel: 'Precio por M³' },
  ],
  Servicios: [
    { value: 'Luz', label: 'Luz' },
    { value: 'Agua', label: 'Agua' },
    { value: 'Telefono', label: 'Teléfono' },
    { value: 'Internet', label: 'Internet' },
    { value: 'Aseo', label: 'Aseo' },
  ],
  'Gasto de Personal': [
    { value: 'Nomina', label: 'Nómina' },
    { value: 'Uniformes', label: 'Uniformes' },
    { value: 'Implemento de Seguridad', label: 'Implemento de Seguridad' },
    { value: 'Seguro Social', label: 'Seguro Social' },
    { value: 'FAOV', label: 'FAOV' },
    { value: 'Inces', label: 'Inces' },
    { value: 'Utilidades', label: 'Utilidades' },
    { value: 'Vacaciones', label: 'Vacaciones' },
    { value: 'Fideicomiso', label: 'Fideicomiso' },
    { value: 'Bono de Alimentacion', label: 'Bono de Alimentación' },
    { value: 'Comisiones de Ventas', label: 'Comisiones de Ventas' },
  ],
  'Impuestos y Contribuciones': [
    { value: 'Seniat', label: 'Seniat' },
    { value: 'Alcaldia', label: 'Alcaldía' },
    { value: 'Timbre Fiscales', label: 'Timbre Fiscales' },
    { value: 'Aranceles', label: 'Aranceles' },
  ],
};

function getTodayStr() { return new Date().toISOString().split('T')[0]; }

export function EgresoForm({ onAdd, onClose }: EgresoFormProps) {
  const [tasaCambio, setTasaCambio] = useState<number>(0);
  const [cargandoTasa, setCargandoTasa] = useState(true);
  const [errorTasa, setErrorTasa] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [listaProveedores, setListaProveedores] = useState<any[]>([]);
  const [listaBancos, setListaBancos] = useState<any[]>([]);
  const [proveedorId, setProveedorId] = useState('');

  const [bancoId, setBancoId] = useState('');
  const [fecha, setFecha] = useState(getTodayStr());
  const [nombreProveedor, setNombreProveedor] = useState('');
  const [prefijoRif, setPrefijoRif] = useState('V');
  const [numeroRif, setNumeroRif] = useState('');
  const [clasificacion, setClasificacion] = useState('');
  const [subCategoria, setSubCategoria] = useState('');
  const [detalleExtra, setDetalleExtra] = useState('');
  const [cantidadProduccion, setCantidadProduccion] = useState('');
  const [precioUnitario, setPrecioUnitario] = useState('');
  const [montoBs, setMontoBs] = useState('');
  const [montoUsd, setMontoUsd] = useState('');
  const [monedaEntrada, setMonedaEntrada] = useState<'BS' | 'USD'>('BS');
  const [referencia, setReferencia] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [comprobantes, setComprobantes] = useState<{ name: string; url: string }[]>([]);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [bcvRes, provRes, bancosRes] = await Promise.all([
          fetch('/api/bcv'),
          fetch('/api/proveedores'),
          fetch('/api/bancos/select'),
        ]);
        const bcvData = await bcvRes.json();
        if (bcvData.tasa) setTasaCambio(bcvData.tasa);
        else setErrorTasa('No se pudo obtener la tasa');

        const provData = await provRes.json();
        setListaProveedores(provData.proveedores || []);

        const bancosData = await bancosRes.json();
        setListaBancos(Array.isArray(bancosData) ? bancosData : []);
      } catch { setErrorTasa('No se pudo obtener datos iniciales'); }
      setCargandoTasa(false);
    };
    fetchInitial();
  }, []);

  const montoBsNum = monedaEntrada === 'BS' ? (parseFloat(montoBs) || 0) : (parseFloat(montoUsd) || 0) * tasaCambio;
  const montoUsdNum = monedaEntrada === 'USD' ? (parseFloat(montoUsd) || 0) : (parseFloat(montoBs) || 0) / (tasaCambio || 1);

  const subCats = clasificacion ? SUB_CATEGORIAS[clasificacion] || [] : [];
  const subCatData = subCats.find(s => s.value === subCategoria);

  useEffect(() => { setSubCategoria(''); setDetalleExtra(''); setCantidadProduccion(''); setPrecioUnitario(''); }, [clasificacion]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bancoId || !nombreProveedor || !clasificacion || !referencia || comprobantes.length === 0) return;

    const rif = `${prefijoRif}-${numeroRif}`;
    const bancoSeleccionado = listaBancos.find((b: any) => b.id === Number(bancoId));

    onAdd({
      banco: bancoSeleccionado?.nombreBanco || '',
      bancoId: Number(bancoId), fecha, nombreProveedor, rif, clasificacionGasto: clasificacion,
      subCategoria, detalleExtra, descripcion, montoBs: montoBsNum,
      montoDivisa: montoUsdNum, tasaCambio, referencia, comprobantes,
      cantidadProduccion: parseFloat(cantidadProduccion) || null,
      precioUnitario: parseFloat(precioUnitario) || null,
    });

    setShowSuccess(true);
    setTimeout(() => {
      setBancoId(''); setFecha(getTodayStr()); setProveedorId(''); setNombreProveedor(''); setNumeroRif('');
      setClasificacion(''); setSubCategoria(''); setDetalleExtra('');
      setCantidadProduccion(''); setPrecioUnitario(''); setMontoBs(''); setMontoUsd('');
      setMonedaEntrada('BS'); setReferencia(''); setDescripcion(''); setComprobantes([]); setShowSuccess(false);
    }, 1500);
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
          <h3 className="text-2xl font-black text-slate-900 mb-2">¡Egreso Registrado!</h3>
          <p className="text-slate-500 text-sm font-medium text-center px-10">Los datos se han guardado correctamente.</p>
        </div>
      )}

      <div className="p-6 space-y-5 flex-1 flex flex-col overflow-y-auto">
        {/* Tasa BCV */}
        <div className={`flex items-center justify-between py-2.5 px-4 rounded-lg border shadow-sm ${errorTasa ? 'bg-red-50 border-red-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
          <div className="flex items-center gap-2.5">
            <TrendingDown size={18} className={errorTasa ? 'text-red-500' : 'text-emerald-500'} />
            <span className="text-xs font-bold text-slate-800">Tasa BCV</span>
          </div>
          <span className="text-sm font-black text-slate-900">Bs. {tasaCambio || '0.00'}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* COLUMNA IZQUIERDA */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-slate-200 flex items-center justify-center text-slate-600 text-[10px]">1</span> Datos del Egreso
            </h4>

            <div className="grid grid-cols-2 gap-3">
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
                <label className={labelCls}>Fecha *</label>
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Nombre Proveedor *</label>
              <select
                value={proveedorId}
                onChange={e => {
                  const id = e.target.value;
                  setProveedorId(id);
                  const p = listaProveedores.find((pr: any) => pr.id === Number(id));
                  if (p) {
                    setNombreProveedor(p.nombre);
                    const rifStr = p.rif || '';
                    const parts = rifStr.split('-');
                    if (parts.length === 2) { setPrefijoRif(parts[0]); setNumeroRif(parts[1]); }
                    else { setNumeroRif(rifStr); }
                  } else { setNombreProveedor(''); setNumeroRif(''); }
                }}
                required className={inputCls}
              >
                <option value="">Seleccione proveedor...</option>
                {listaProveedores.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>RIF / Cédula *</label>
              <div className="flex gap-2">
                <select value={prefijoRif} onChange={e => setPrefijoRif(e.target.value)} className="w-[70px] px-2 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-800 bg-white">
                  <option value="V">V</option><option value="J">J</option><option value="G">G</option><option value="E">E</option><option value="P">P</option>
                </select>
                <input type="text" value={numeroRif} onChange={e => setNumeroRif(e.target.value.replace(/[^0-9\-]/g, ''))} required className={`${inputCls} flex-1`} placeholder="12345678" readOnly />
              </div>
            </div>

            <div>
              <label className={labelCls}>Clasificación de Gasto *</label>
              <select value={clasificacion} onChange={e => setClasificacion(e.target.value)} required className={inputCls}>
                <option value="">Seleccione...</option>
                {CLASIFICACIONES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {clasificacion && (
              <div>
                <label className={labelCls}>Subcategoría *</label>
                <select value={subCategoria} onChange={e => setSubCategoria(e.target.value)} required className={inputCls}>
                  <option value="">Seleccione...</option>
                  {subCats.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            )}

            {subCatData?.extra && (
              <div>
                <label className={labelCls}>{subCatData.extra} *</label>
                <input type="text" value={detalleExtra} onChange={e => setDetalleExtra(e.target.value)} required className={inputCls} placeholder={`Ingrese ${subCatData.extra.toLowerCase()}`} />
              </div>
            )}

            {clasificacion === 'Produccion' && subCatData && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Cantidad ({subCatData.unidad}) *</label>
                  <input type="number" step="0.01" value={cantidadProduccion} onChange={e => setCantidadProduccion(e.target.value)} required className={inputCls} placeholder="0" />
                </div>
                <div>
                  <label className={labelCls}>{subCatData.precioLabel} *</label>
                  <input type="number" step="0.01" value={precioUnitario} onChange={e => setPrecioUnitario(e.target.value)} required className={inputCls} placeholder="0.00" />
                </div>
              </div>
            )}

            <div>
              <label className={labelCls}>Descripción</label>
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} className={`${inputCls} resize-none h-16`} placeholder="Detalles adicionales..." />
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-slate-200 flex items-center justify-center text-slate-600 text-[10px]">2</span> Monto y Comprobante
            </h4>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className={labelCls}>Monto</label>
                <div className="flex bg-slate-200/60 p-0.5 rounded border border-slate-200">
                  <button type="button" onClick={() => setMonedaEntrada('BS')} className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${monedaEntrada === 'BS' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Bs</button>
                  <button type="button" onClick={() => setMonedaEntrada('USD')} className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${monedaEntrada === 'USD' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>$</button>
                </div>
              </div>
              <div>
                <label className={labelCls}>{monedaEntrada === 'BS' ? 'Monto (Bs) *' : 'Monto ($) *'}</label>
                <input
                  type="number" step="0.01" required
                  value={monedaEntrada === 'BS' ? montoBs : montoUsd}
                  onChange={e => monedaEntrada === 'BS' ? setMontoBs(e.target.value) : setMontoUsd(e.target.value)}
                  className={inputCls} placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div>
                  <label className={labelCls}>Total (Bs)</label>
                  <input type="text" readOnly value={montoBsNum.toFixed(2)} className={`${inputCls} bg-slate-50 cursor-not-allowed font-bold`} />
                </div>
                <div>
                  <label className={labelCls}>Total ($)</label>
                  <input type="text" readOnly value={montoUsdNum.toFixed(4)} className={`${inputCls} bg-slate-50 cursor-not-allowed font-mono text-emerald-700 font-bold`} />
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Referencia *</label>
              <input type="text" value={referencia} onChange={e => setReferencia(e.target.value)} required className={inputCls} placeholder="Número de referencia" />
            </div>

            {/* Comprobante - REQUERIDO */}
            <div>
              <label className={labelCls}>Comprobante de Pago * (requerido)</label>
              <div className="border-2 border-dashed border-red-300 bg-red-50/30 rounded-lg p-4 text-center hover:border-red-400 transition cursor-pointer" onClick={() => document.getElementById('comprobante-egreso')?.click()}>
                <Upload size={24} className="mx-auto text-red-400 mb-1" />
                <p className="text-xs font-semibold text-red-600">Adjuntar comprobante de pago</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Imágenes o PDF</p>
                <input id="comprobante-egreso" type="file" accept="image/*,.pdf" multiple className="hidden" onChange={handleFileUpload} />
              </div>
              {comprobantes.length > 0 ? (
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
              ) : (
                <p className="text-[10px] text-red-400 mt-1 font-medium">Debe adjuntar al menos un comprobante</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
        <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-700 hover:bg-slate-200 bg-slate-100 border border-slate-200 rounded-lg px-5 py-2 text-sm font-medium transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={comprobantes.length === 0} className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-6 py-2 shadow-md transition-all text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          Registrar Egreso
        </button>
      </div>
    </form>
  );
}
