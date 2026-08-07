"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, X } from "lucide-react";

function RetencionesTable() {
  const [data, setData] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroFactura, setFiltroFactura] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFiltro, setIsLoadingFiltro] = useState(false);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await fetch("/api/clientes");
        if (!res.ok) return;
        const data = await res.json();
        const arr = Array.isArray(data) ? data : (data.clientes || data.data || []);
        setClientes(arr.filter((c: any) => c.es_contribuyente_especial === 1));
      } catch {}
    };
    fetchClientes();
  }, []);

  useEffect(() => {
    if (!filtroCliente) {
      setFacturas([]);
      setFiltroFactura("");
      return;
    }
    const fetchFacturas = async () => {
      setIsLoadingFiltro(true);
      try {
        const res = await fetch("/api/retenciones/facturas-contribuyentes");
        if (!res.ok) return;
        const data = await res.json();
        const arr = Array.isArray(data) ? data : (data.facturas || []);
        setFacturas(arr.filter((f: any) => String(f.cliente_id) === filtroCliente));
      } catch {} finally {
        setIsLoadingFiltro(false);
      }
    };
    fetchFacturas();
  }, [filtroCliente]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (filtroCliente) params.set("cliente_id", filtroCliente);
        if (filtroFactura) params.set("factura_id", filtroFactura);

        const url = `/api/retenciones${params.toString() ? `?${params.toString()}` : ""}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Fallo al obtener los datos");
        const result = await response.json();
        const arregloDatos = Array.isArray(result) ? result : (result.retenciones || result.data || []);
        setData(arregloDatos);
      } catch {
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [filtroCliente, filtroFactura]);

  const limpiarFiltros = () => {
    setFiltroCliente("");
    setFiltroFactura("");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 min-w-0">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 block">Cliente Contribuyente</label>
          <select
            value={filtroCliente}
            onChange={(e) => { setFiltroCliente(e.target.value); setFiltroFactura(""); }}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
          >
            <option value="">Todos los clientes</option>
            {clientes.map((c: any) => (
              <option key={c.id} value={c.id}>{c.nombre} ({c.rif})</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-0">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 block">Factura</label>
          <select
            value={filtroFactura}
            onChange={(e) => setFiltroFactura(e.target.value)}
            disabled={!filtroCliente || isLoadingFiltro}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all disabled:opacity-40"
          >
            <option value="">{!filtroCliente ? "Seleccionar cliente primero..." : isLoadingFiltro ? "Cargando..." : "Todas las facturas"}</option>
            {facturas.map((f: any) => (
              <option key={f.id} value={f.id}>#{f.id} — Bs. {Number(f.total).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</option>
            ))}
          </select>
        </div>

        {(filtroCliente || filtroFactura) && (
          <button
            onClick={limpiarFiltros}
            className="px-4 py-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 shrink-0"
          >
            <X size={14} /> Limpiar
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="p-12 text-center">
          <Loader2 size={24} className="animate-spin text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-sm">Cargando retenciones...</p>
        </div>
      ) : !data || data.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <p className="text-slate-500 font-medium">
            {filtroCliente || filtroFactura ? "No se encontraron retenciones con los filtros seleccionados." : "No hay retenciones registradas en el sistema."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Factura</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">RIF</th>
                <th className="px-6 py-4">Total Factura</th>
                <th className="px-6 py-4">IVA (16%)</th>
                <th className="px-6 py-4">Retención</th>
                <th className="px-6 py-4 text-right">Monto Retenido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((ret) => (
                <tr key={ret.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                    {new Date(ret.fecha || ret.created_at).toLocaleDateString("es-VE")}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-bold">
                      #{ret.factura_id}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">{ret.cliente_nombre}</td>
                  <td className="px-6 py-4 font-mono text-slate-600">{ret.cliente_rif}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    Bs. {Number(ret.factura_total).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-blue-600">
                    Bs. {Number(ret.iva_monto).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-orange-600">
                    {ret.porcentaje_retencion}%
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600">
                    Bs. {Number(ret.monto_retenido).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export { RetencionesTable };
export default RetencionesTable;
