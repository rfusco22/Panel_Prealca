"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, CheckCircle2, TrendingDown, Loader2 } from "lucide-react";

const CLASIFICACIONES = [
  { value: "Mantenimiento", label: "Mantenimiento" },
  { value: "Produccion", label: "Producción" },
  { value: "Servicios", label: "Servicios" },
  { value: "Gasto de Personal", label: "Gasto de Personal" },
  { value: "Impuestos y Contribuciones", label: "Impuestos y Contribuciones" },
];

const SUB_CATEGORIAS: Record<string, { value: string; label: string; extra?: string }[]> = {
  Mantenimiento: [
    { value: "Repuesto", label: "Repuesto", extra: "Camino" },
    { value: "Lubricante", label: "Lubricante", extra: "Camino" },
    { value: "Cauchos", label: "Cauchos", extra: "Camino" },
    { value: "Latoneria y Pintura", label: "Latonería y Pintura", extra: "Camión" },
    { value: "Oficina y Planta", label: "Oficina y Planta" },
  ],
  Produccion: [
    { value: "Arena", label: "Arena", unidad: "M³", precioLabel: "Precio por M³" },
    { value: "Piedra", label: "Piedra", unidad: "M³", precioLabel: "Precio por M³" },
    { value: "Cemento", label: "Cemento", unidad: "Tonelada", precioLabel: "Precio por Tonelada" },
    { value: "Aditivo", label: "Aditivo", unidad: "Litro", precioLabel: "Precio por Litro" },
    { value: "Fibra", label: "Fibra", unidad: "Bolsa", precioLabel: "Precio por Bolsa" },
    { value: "Flete", label: "Flete", unidad: "M³", precioLabel: "Precio por M³" },
  ],
  Servicios: [
    { value: "Luz", label: "Luz" },
    { value: "Agua", label: "Agua" },
    { value: "Telefono", label: "Teléfono" },
    { value: "Internet", label: "Internet" },
    { value: "Aseo", label: "Aseo" },
  ],
  "Gasto de Personal": [
    { value: "Nomina", label: "Nómina" },
    { value: "Uniformes", label: "Uniformes" },
    { value: "Implemento de Seguridad", label: "Implemento de Seguridad" },
    { value: "Seguro Social", label: "Seguro Social" },
    { value: "FAOV", label: "FAOV" },
    { value: "Inces", label: "Inces" },
    { value: "Utilidades", label: "Utilidades" },
    { value: "Vacaciones", label: "Vacaciones" },
    { value: "Fideicomiso", label: "Fideicomiso" },
    { value: "Bono de Alimentacion", label: "Bono de Alimentación" },
    { value: "Comisiones de Ventas", label: "Comisiones de Ventas" },
  ],
  "Impuestos y Contribuciones": [
    { value: "Seniat", label: "Seniat" },
    { value: "Alcaldia", label: "Alcaldía" },
    { value: "Timbre Fiscales", label: "Timbre Fiscales" },
    { value: "Aranceles", label: "Aranceles" },
  ],
};

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

interface EgresoFormProps {
  onClose?: () => void;
}

function EgresoForm({ onClose }: EgresoFormProps) {
  const { register, handleSubmit, watch, setValue, reset } = useForm();
  const [tasaCambio, setTasaCambio] = useState<number>(0);
  const [cargandoTasa, setCargandoTasa] = useState(true);
  const [errorTasa, setErrorTasa] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState("");
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  const clasificacion = watch("clasificacionGasto");
  const subCategoria = watch("subCategoria");
  const montoBs = watch("montoBs");
  const fecha = watch("fecha");

  useEffect(() => {
    const fetchBCVRate = async () => {
      setCargandoTasa(true);
      setErrorTasa(null);
      try {
        const res = await fetch("/api/bcv");
        const data = await res.json();
        if (data.success && data.tasa) {
          setTasaCambio(data.tasa);
          setUltimaActualizacion(new Date().toLocaleString("es-VE", { dateStyle: "medium", timeStyle: "short" }));
        } else {
          setErrorTasa("No se pudo obtener la tasa.");
        }
      } catch {
        setErrorTasa("No se pudo obtener la tasa actual.");
      } finally {
        setCargandoTasa(false);
      }
    };
    fetchBCVRate();
  }, []);

  const montoDivisa = tasaCambio > 0 && montoBs ? (parseFloat(montoBs) / tasaCambio).toFixed(2) : "0.00";

  const subCats = clasificacion ? SUB_CATEGORIAS[clasificacion] || [] : [];
  const subCatData = subCats.find((s) => s.value === subCategoria);

  const onFormSubmit = async (data: any) => {
    setLocalLoading(true);
    setMensaje({ tipo: "", texto: "" });
    try {
      const payload = {
        ...data,
        montoBs: parseFloat(data.montoBs),
        montoDivisa: parseFloat(montoDivisa),
        tasaCambio,
        fecha: data.fecha || getTodayStr(),
      };
      const res = await fetch("/api/egresos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al registrar");
      setShowSuccessPopup(true);
      setTimeout(() => { if (onClose) onClose(); }, 1500);
    } catch (err: any) {
      setMensaje({ tipo: "error", texto: err.message || "Error al registrar." });
    } finally {
      setLocalLoading(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-300 bg-white transition-all";
  const labelCls = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1";

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col h-full relative overflow-hidden">
      {showSuccessPopup && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center rounded-2xl">
          <div className="bg-emerald-100 text-emerald-500 p-4 rounded-full mb-5 animate-bounce">
            <CheckCircle2 size={56} strokeWidth={2.5} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">¡Egreso Registrado!</h3>
          <p className="text-slate-500 text-sm font-medium text-center px-10">Los datos se han guardado correctamente.</p>
        </div>
      )}

      <div className="p-6 space-y-5 flex-1 flex flex-col">
        {/* TASA BCV */}
        <div className={`flex items-center justify-between py-2.5 px-4 rounded-lg border shadow-sm ${errorTasa ? "bg-red-50 border-red-100" : "bg-emerald-50/50 border-emerald-100"}`}>
          <div className="flex items-center gap-2.5">
            <TrendingDown size={18} className={errorTasa ? "text-red-500" : "text-emerald-500"} />
            <div>
              <span className="text-xs font-bold text-slate-800">Tasa Oficial BCV</span>
              <span className="text-[10px] font-medium text-slate-500 ml-2">
                {cargandoTasa ? "Cargando..." : errorTasa ? errorTasa : `Act: ${ultimaActualizacion}`}
              </span>
            </div>
          </div>
          <span className="text-sm font-black text-slate-900">Bs. {tasaCambio > 0 ? tasaCambio : "0.00"}</span>
        </div>

        {mensaje.texto && (
          <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium border ${mensaje.tipo === "error" ? "bg-red-50 text-red-700 border-red-100" : "bg-blue-50 text-blue-700 border-blue-100"}`}>
            <AlertCircle size={16} /> {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch flex-1">
          {/* COLUMNA IZQUIERDA */}
          <div className="flex flex-col space-y-4 bg-slate-50/50 p-5 rounded-xl border border-slate-100 h-full">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-md bg-slate-200 flex items-center justify-center text-slate-600 text-[10px]">1</span> Datos del Egreso
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Banco *</label>
                <select {...register("banco", { required: true })} className={inputCls}>
                  <option value="">Seleccione...</option>
                  <option value="Mercantil">Mercantil</option>
                  <option value="Banesco">Banesco</option>
                  <option value="Provincial">Provincial</option>
                  <option value="Venezuela">Venezuela</option>
                  <option value="BDV">BDV</option>
                  <option value="Bancamiga">Bancamiga</option>
                  <option value="Banplus">Banplus</option>
                  <option value="BNC">BNC</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Fecha *</label>
                <input type="date" {...register("fecha")} defaultValue={getTodayStr()} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Nombre Proveedor *</label>
              <input type="text" {...register("nombreProveedor", { required: true })} className={inputCls} placeholder="Nombre del proveedor" />
            </div>

            <div>
              <label className={labelCls}>RIF / Cédula *</label>
              <div className="flex gap-2">
                <select {...register("prefijoRif")} className="w-[70px] px-2 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white">
                  <option value="V">V</option>
                  <option value="J">J</option>
                  <option value="G">G</option>
                  <option value="E">E</option>
                  <option value="P">P</option>
                </select>
                <input type="text" {...register("numeroRif", { required: true })} className={`${inputCls} flex-1`} placeholder="12345678" onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9\-]/g, ""); }} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Clasificación de Gasto *</label>
              <select {...register("clasificacionGasto", { required: true })} className={inputCls}>
                <option value="">Seleccione...</option>
                {CLASIFICACIONES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {clasificacion && (
              <div>
                <label className={labelCls}>Subcategoría *</label>
                <select {...register("subCategoria", { required: true })} className={inputCls}>
                  <option value="">Seleccione...</option>
                  {subCats.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            )}

            {subCatData?.extra && (
              <div>
                <label className={labelCls}>{subCatData.extra} *</label>
                <input type="text" {...register("detalleExtra")} className={inputCls} placeholder={`Ingrese ${subCatData.extra.toLowerCase()}`} />
              </div>
            )}

            {clasificacion === "Produccion" && subCatData && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Cantidad ({subCatData.unidad}) *</label>
                  <input type="number" step="0.01" {...register("cantidadProduccion")} className={inputCls} placeholder="0" />
                </div>
                <div>
                  <label className={labelCls}>{subCatData.precioLabel} *</label>
                  <input type="number" step="0.01" {...register("precioUnitario")} className={inputCls} placeholder="0.00" />
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA */}
          <div className="flex flex-col space-y-4 bg-slate-50/50 p-5 rounded-xl border border-slate-100 h-full">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-2 shrink-0">
              <span className="w-5 h-5 rounded-md bg-slate-200 flex items-center justify-center text-slate-600 text-[10px]">2</span> Monto y Referencia
            </h4>

            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm space-y-3">
              <div>
                <label className={labelCls}>Monto (Bs) *</label>
                <input type="number" step="0.01" {...register("montoBs", { required: true })} className={inputCls} placeholder="0.00" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div>
                  <label className={labelCls}>Total (Bs)</label>
                  <input type="text" readOnly value={montoBs || "0.00"} className={`${inputCls} bg-slate-50 cursor-not-allowed font-bold text-slate-900`} />
                </div>
                <div>
                  <label className={labelCls}>Equivalente (USD)</label>
                  <input type="text" readOnly value={montoDivisa} className={`${inputCls} bg-slate-50 cursor-not-allowed font-mono text-emerald-700 font-bold`} />
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Referencia *</label>
              <input type="text" {...register("referencia", { required: true })} className={inputCls} placeholder="Número de referencia" />
            </div>

            <div className="flex flex-col flex-1 pt-1 min-h-[80px]">
              <label className={labelCls}>Descripción</label>
              <textarea {...register("descripcion")} className={`${inputCls} resize-none flex-1`} placeholder="Detalles adicionales..."></textarea>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
        <button type="button" onClick={onClose} disabled={localLoading || showSuccessPopup} className="text-slate-500 hover:text-slate-700 hover:bg-slate-200 bg-slate-100 border border-slate-200 rounded-lg px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50">
          Cancelar
        </button>
        <button type="submit" disabled={localLoading || showSuccessPopup} className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-6 py-2 shadow-md transition-all text-sm font-semibold flex items-center gap-2 disabled:opacity-75">
          {localLoading && <Loader2 size={16} className="animate-spin" />}
          {localLoading ? "Procesando..." : "Registrar Egreso"}
        </button>
      </div>
    </form>
  );
}

export { EgresoForm };
export default EgresoForm;
