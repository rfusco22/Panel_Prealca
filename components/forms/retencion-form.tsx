"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface FacturaContribuyente {
  id: number;
  total: number;
  fecha: string;
  estado: string;
  cliente_id: number;
  cliente_nombre: string;
  cliente_rif: string;
  iva_monto: number;
  cantidad_m3: number;
  precio_m3: number;
  resistencia: string;
  pulgada: string;
}

function RetencionForm({ onClose }: { onClose: () => void }) {
  const [facturas, setFacturas] = useState<FacturaContribuyente[]>([]);
  const [isLoadingFacturas, setIsLoadingFacturas] = useState(true);
  const [selectedFactura, setSelectedFactura] = useState<FacturaContribuyente | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [porcentaje, setPorcentaje] = useState(75);

  useEffect(() => {
    const fetchFacturas = async () => {
      try {
        const res = await fetch("/api/retenciones/facturas-contribuyentes");
        if (!res.ok) throw new Error("Error");
        const data = await res.json();
        setFacturas(data.facturas || []);
      } catch {
        setError("No se pudieron cargar las facturas.");
      } finally {
        setIsLoadingFacturas(false);
      }
    };
    fetchFacturas();
  }, []);

  const ivaCalc = selectedFactura ? (selectedFactura.iva_monto) : 0;
  const montoRetenido = selectedFactura ? (ivaCalc * porcentaje) / 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFactura) return;
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/retenciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: selectedFactura.cliente_id,
          factura_id: selectedFactura.id,
          monto_retenido: montoRetenido.toFixed(2),
          porcentaje_retencion: porcentaje,
          usuario_id: 1,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al registrar la retención.");
      }

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
            Seleccionar Factura
          </h4>

          {isLoadingFacturas ? (
            <div className="p-8 text-center">
              <Loader2 size={24} className="animate-spin text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Cargando facturas...</p>
            </div>
          ) : facturas.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-slate-500 text-sm font-medium">No hay facturas de contribuyentes especiales disponibles.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Factura *</label>
              <select
                required
                value={selectedFactura?.id || ""}
                onChange={(e) => {
                  const f = facturas.find((x) => x.id === Number(e.target.value));
                  setSelectedFactura(f || null);
                }}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              >
                <option value="">Seleccionar factura...</option>
                {facturas.map((f) => (
                  <option key={f.id} value={f.id}>
                    #{f.id} — {f.cliente_nombre} ({f.cliente_rif}) — Bs. {Number(f.total).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedFactura && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-100">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Cliente:</span>
                <span className="font-bold text-slate-900">{selectedFactura.cliente_nombre}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">RIF:</span>
                <span className="font-mono font-bold text-slate-900">{selectedFactura.cliente_rif}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Producto:</span>
                <span className="font-bold text-slate-900">{selectedFactura.resistencia} - {selectedFactura.pulgada}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Cantidad:</span>
                <span className="font-bold text-slate-900">{Number(selectedFactura.cantidad_m3).toLocaleString("es-VE")} m³</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Precio unitario:</span>
                <span className="font-bold text-slate-900">Bs. {Number(selectedFactura.precio_m3).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-2">
                <span className="text-slate-500 font-bold">Total Factura:</span>
                <span className="font-bold text-slate-900">Bs. {Number(selectedFactura.total).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
            Cálculo de Retención
          </h4>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Porcentaje de Retención (%)</label>
            <input
              type="number"
              value={porcentaje}
              onChange={(e) => setPorcentaje(Number(e.target.value))}
              min="0"
              max="100"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
            <p className="text-xs text-slate-400 mt-1">Según contribuyente especial (75% IVA)</p>
          </div>

          {selectedFactura && (
            <div className="bg-slate-50 rounded-xl p-5 space-y-3 border border-slate-100">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Total Factura:</span>
                <span className="font-bold text-slate-900">Bs. {Number(selectedFactura.total).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">IVA (16%):</span>
                <span className="font-bold text-blue-600">Bs. {ivaCalc.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-slate-200 pt-3">
                <span className="text-slate-500 font-bold">Monto Retenido ({porcentaje}%):</span>
                <span className="font-bold text-emerald-600 text-lg">Bs. {montoRetenido.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !selectedFactura}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Registrando...
            </span>
          ) : (
            "Registrar Retención"
          )}
        </button>
      </div>
    </form>
  );
}

export { RetencionForm };
export default RetencionForm;
