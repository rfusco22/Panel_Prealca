"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, CheckCircle2, TrendingUp, Loader2 } from "lucide-react";

interface IngresoFormProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
  title: string;
  bancos: { id: number; nombreBanco: string }[];
  clientes: { id: number; nombre: string; rif?: string }[];
  vendedores: { id: number; nombre: string }[];
  onClose?: () => void;
}

function IngresoForm({ onSubmit, isLoading: externalLoading, title, onClose }: IngresoFormProps) {
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      aplicaIva: false,
      precioBs: 0,
      tipoDocumento: "FACTURA",
      nombreCliente: "",
      rif: "",
      valorComision: ""
    }
  });
  
  const [tasaCambio, setTasaCambio] = useState<number>(0);
  const [cargandoTasa, setCargandoTasa] = useState(true);
  const [errorTasa, setErrorTasa] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string>("");
  
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [totalBsVisual, setTotalBsVisual] = useState("0.00"); 
  
  const [tipoComision, setTipoComision] = useState<"PORCENTAJE" | "MONTO">("PORCENTAJE");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  const precioBs = watch("precioBs", 0);
  const aplicaIva = watch("aplicaIva", false);
  const clienteSeleccionado = watch("nombreCliente");

  const isLoading = externalLoading || localLoading;

  useEffect(() => {
    const fetchBCVRate = async () => {
      setCargandoTasa(true);
      setErrorTasa(null);
      try {
        const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        if (!res.ok) throw new Error('Error en la red');
        const data = await res.json();
        if (data && data.promedio) {
          setTasaCambio(data.promedio);
          setValue("tasaCambio", data.promedio); 
          const updateDate = new Date(data.fechaActualizacion);
          setUltimaActualizacion(updateDate.toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'short' }));
        }
      } catch (error) {
        setErrorTasa('No se pudo obtener la tasa actual.');
      } finally {
        setCargandoTasa(false);
      }
    };
    fetchBCVRate();
  }, [setValue]);

  useEffect(() => {
    if (tasaCambio > 0) {
      const baseBs = parseFloat(precioBs.toString()) || 0;
      const ivaBs = aplicaIva ? (baseBs * 0.16) : 0;
      const totalConIvaBs = baseBs + ivaBs;
      const totalConIvaUsd = totalConIvaBs / tasaCambio;

      setValue("montoIva", ivaBs.toFixed(2));
      setValue("precioDivisa", totalConIvaUsd.toFixed(2));
      setTotalBsVisual(totalConIvaBs.toFixed(2));
    }
  }, [precioBs, aplicaIva, tasaCambio, setValue]);

  const onFormSubmit = async (data: any) => {
    setLocalLoading(true);
    setMensaje({ tipo: "", texto: "" });
    try {
      const valorNum = parseFloat(data.valorComision) || null;
      const payload = {
        ...data,
        comision_porcentaje: tipoComision === "PORCENTAJE" ? valorNum : null,
        comision_monto: tipoComision === "MONTO" ? valorNum : null,
      };
      delete payload.valorComision;

      await onSubmit(payload);
      setShowSuccessPopup(true);
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (error: any) {
      setMensaje({ tipo: "error", texto: error.message || "Error al registrar." });
    } finally {
      setLocalLoading(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-300 bg-white transition-all";
  const labelCls = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1";

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col h-full relative overflow-hidden">
      {showSuccessPopup && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center rounded-2xl transition-all duration-300">
          <div className="bg-emerald-100 text-emerald-500 p-4 rounded-full mb-5 animate-bounce">
            <CheckCircle2 size={56} strokeWidth={2.5} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">¡Ingreso Registrado!</h3>
          <p className="text-slate-500 text-sm font-medium text-center px-10 max-w-sm">
            Los datos se han guardado correctamente en la base de datos.
          </p>
        </div>
      )}

      <div className="p-6 space-y-5 flex-1 flex flex-col">
        <div className={`flex items-center justify-between py-2.5 px-4 rounded-lg border shadow-sm ${errorTasa ? 'bg-red-50 border-red-100' : 'bg-emerald-50/50 border-emerald-100'} shrink-0`}>
          <div className="flex items-center gap-2.5">
            <TrendingUp size={18} className={errorTasa ? 'text-red-500' : 'text-emerald-500'} />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-xs font-bold text-slate-800">Tasa Oficial BCV</span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="text-[10px] font-medium text-slate-500">
                {cargandoTasa ? "Conectando..." : errorTasa ? errorTasa : `Act: ${ultimaActualizacion}`}
              </span>
            </div>
          </div>
          <div>
            <span className="text-sm font-black text-slate-900">Bs. {tasaCambio > 0 ? tasaCambio : "0.00"}</span>
          </div>
        </div>

        {mensaje.texto && (
          <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium border ${mensaje.tipo === "error" ? "bg-red-50 text-red-700 border-red-100" : "bg-blue-50 text-blue-700 border-blue-100"} shrink-0`}>
            {mensaje.tipo === "info" ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch flex-1">
          <div className="flex flex-col space-y-4 bg-slate-50/50 p-5 rounded-xl border border-slate-100 h-full">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-md bg-slate-200 flex items-center justify-center text-slate-600 text-[10px]">1</span> Datos Bancarios
            </h4>
            <input type="hidden" {...register("tasaCambio")} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Banco Origen</label>
                <select {...register("banco", { required: true })} className={inputCls}>
                  <option value="">Seleccione...</option>
                  <option value="Mercantil">Mercantil</option>
                  <option value="Banesco">Banesco</option>
                  <option value="Provincial">Provincial</option>
                  <option value="Venezuela">Venezuela</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Método de Pago</label>
                <select {...register("metodoPago", { required: true })} className={inputCls}>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="PAGO_MOVIL">Pago Móvil</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Número de Referencia</label>
              <input type="text" {...register("referencia", { required: true })} className={inputCls} placeholder="Ej: 12345678" />
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm space-y-3">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className={labelCls}>Monto Base (Bs)</label>
                  <input type="number" step="0.01" {...register("precioBs", { required: true })} className={inputCls} placeholder="0.00" />
                </div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <input type="checkbox" id="aplicaIva" {...register("aplicaIva")} className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer" />
                  <label htmlFor="aplicaIva" className="text-xs font-bold text-slate-700 cursor-pointer select-none">+ IVA</label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div>
                  <label className={labelCls}>Total (Bs)</label>
                  <input type="text" readOnly value={totalBsVisual} className={`${inputCls} bg-slate-50 cursor-not-allowed font-bold text-slate-900`} placeholder="0.00" />
                </div>
                <div>
                  <label className={labelCls}>Equivalente (USD)</label>
                  <input type="number" step="0.01" {...register("precioDivisa")} readOnly className={`${inputCls} bg-slate-50 cursor-not-allowed font-mono text-emerald-700 font-bold`} placeholder="0.00" />
                </div>
              </div>
            </div>
            <div className="mt-auto pt-2">
              <label className={labelCls}>Tipo de Documento</label>
              <select {...register("tipoDocumento", { required: true })} className={inputCls}>
                <option value="FACTURA">Factura</option>
                <option value="ANTICIPO">Anticipo</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col space-y-4 bg-slate-50/50 p-5 rounded-xl border border-slate-100 h-full">
             <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-2 shrink-0">
              <span className="w-5 h-5 rounded-md bg-slate-200 flex items-center justify-center text-slate-600 text-[10px]">2</span> Operación y Cliente
            </h4>
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="col-span-2 sm:col-span-1">
                <label className={labelCls}>Cliente / Empresa</label>
                <select {...register("nombreCliente", { required: true })} className={inputCls}>
                  <option value="">Seleccione...</option>
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className={labelCls}>RIF / Cédula</label>
                <input type="text" {...register("rif", { required: true })} className={`${inputCls} bg-slate-100 cursor-not-allowed text-slate-500`} readOnly placeholder="Automático" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div>
                <label className={labelCls}>Vendedor</label>
                <select {...register("vendedor", { required: true })} className={inputCls}>
                  <option value="">Seleccione...</option>
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0">Comisión</label>
                  <div className="flex bg-slate-200/60 p-0.5 rounded border border-slate-200">
                    <button type="button" onClick={() => setTipoComision("PORCENTAJE")} className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-all ${tipoComision === "PORCENTAJE" ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>%</button>
                    <button type="button" onClick={() => setTipoComision("MONTO")} className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-all ${tipoComision === "MONTO" ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>$</button>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-bold text-sm">{tipoComision === "PORCENTAJE" ? "%" : "$"}</span>
                  </div>
                  <input type="number" step="0.01" {...register("valorComision")} className={`${inputCls} pl-7`} placeholder="0.00" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div>
                <label className={labelCls}>Volumen (M3)</label>
                <input type="number" step="0.01" {...register("m3")} className={inputCls} placeholder="Opcional" />
              </div>
              <div>
                <label className={labelCls}>Resistencia</label>
                <select {...register("resistencia")} className={inputCls}>
                  <option value="">Opcional</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col flex-1 pt-1 min-h-[80px]">
              <label className={labelCls}>Descripción</label>
              <textarea {...register("descripcion")} className={`${inputCls} resize-none flex-1`} placeholder="Detalles adicionales opcionales..."></textarea>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
        <button type="button" onClick={onClose} disabled={isLoading || showSuccessPopup} className="text-slate-500 hover:text-slate-700 hover:bg-slate-200 bg-slate-100 border border-slate-200 rounded-lg px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50">
          Cancelar
        </button>
        <button type="submit" disabled={isLoading || cargandoTasa || tasaCambio === 0 || showSuccessPopup} className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-6 py-2 shadow-md transition-all text-sm font-semibold flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed">
          {isLoading && <Loader2 size={16} className="animate-spin" />}
          {isLoading ? "Procesando..." : "Registrar Ingreso"}
        </button>
      </div>
    </form>
  );
}

export { IngresoForm };
export default IngresoForm;
