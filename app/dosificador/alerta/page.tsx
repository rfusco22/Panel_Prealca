"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, TrendingDown } from "lucide-react";

export default function AlertaPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/alerta");
        if (!res.ok) throw new Error("Error");
        const data = await res.json();
        setProductos(data.productos || []);
      } catch {
        setProductos([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Alerta de Materiales</h1>
          <p className="text-slate-500 mt-1">Productos con stock menor a 200 M³ en los últimos 30 días.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <Loader2 size={24} className="animate-spin text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-sm">Cargando alertas...</p>
        </div>
      ) : productos.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <div className="bg-emerald-100 text-emerald-500 p-4 rounded-full mx-auto mb-4 w-fit">
            <AlertTriangle size={32} />
          </div>
          <p className="text-slate-500 font-medium">Todos los productos tienen stock suficiente.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {productos.map((p) => {
            const pct = Math.min((Number(p.total_despachado) / 200) * 100, 100);
            const isCritico = Number(p.total_despachado) < 50;
            return (
              <div key={p.id} className={`bg-white border rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${isCritico ? "border-red-200 bg-red-50/30" : "border-amber-200 bg-amber-50/30"}`}>
                <div className={`p-3 rounded-xl ${isCritico ? "bg-red-100" : "bg-amber-100"}`}>
                  <TrendingDown size={24} className={isCritico ? "text-red-600" : "text-amber-600"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900">{p.resistencia} - {p.pulgada}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isCritico ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {isCritico ? "CRÍTICO" : "BAJO"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Despachado: <span className="font-bold text-slate-800">{Number(p.total_despachado).toLocaleString("es-VE")} {p.unidad}</span> en 30 días
                  </p>
                  <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isCritico ? "bg-red-500" : "bg-amber-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{Number(p.total_despachado).toFixed(2)} / 200 M³</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
