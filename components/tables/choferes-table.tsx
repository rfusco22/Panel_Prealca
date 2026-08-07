"use client";

import { useState, useEffect } from "react";
import { Loader2, Trash2, CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";

function ChoferesTable({ refreshKey }: { refreshKey?: number }) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/choferes");
        if (!res.ok) throw new Error("Error");
        const result = await res.json();
        setData(Array.isArray(result) ? result : (result.choferes || result.data || []));
      } catch {
        setError("Error al cargar choferes.");
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [refreshKey]);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este chofer?")) return;
    try {
      const res = await fetch(`/api/choferes?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error");
      setData(data.filter((c) => c.id !== id));
    } catch {
      setError("No se pudo eliminar.");
    }
  };

  const getDocStatus = (fecha: string | null) => {
    if (!fecha) return { label: "Sin fecha", color: "bg-slate-100 text-slate-500", icon: null };
    const d = new Date(fecha);
    const ahora = new Date();
    const diff = d.getTime() - ahora.getTime();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (dias < 0) return { label: `Vencido (${Math.abs(dias)}d)`, color: "bg-red-100 text-red-700", icon: XCircle };
    if (dias <= 7) return { label: `Vence en ${dias}d`, color: "bg-amber-100 text-amber-700", icon: AlertTriangle };
    if (dias <= 30) return { label: `Vence en ${dias}d`, color: "bg-orange-100 text-orange-700", icon: Clock };
    return { label: d.toLocaleDateString("es-VE"), color: "bg-emerald-50 text-emerald-700", icon: null };
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <Loader2 size={24} className="animate-spin text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium text-sm">Cargando choferes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center bg-red-50 rounded-xl">
        <p className="text-red-600 font-medium text-sm">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
        <p className="text-slate-500 font-medium">No hay choferes registrados.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
          <tr>
            <th className="px-6 py-4">Chofer</th>
            <th className="px-6 py-4">Cédula</th>
            <th className="px-6 py-4">Contacto</th>
            <th className="px-6 py-4">RIF</th>
            <th className="px-6 py-4">Licencia</th>
            <th className="px-6 py-4">Cert. Médico</th>
            <th className="px-6 py-4">Estado</th>
            <th className="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((c) => {
            const licStatus = getDocStatus(c.licencia_vencimiento);
            const certStatus = getDocStatus(c.certificado_vencimiento);
            const rifStatus = getDocStatus(c.rif_vencimiento);
            const LicIcon = licStatus.icon;
            const CertIcon = certStatus.icon;
            const RifIcon = rifStatus.icon;

            return (
              <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                      {c.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{c.nombre}</p>
                      <p className="text-xs text-slate-400">{c.correo}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-slate-600">{c.cedula}</td>
                <td className="px-6 py-4 text-slate-600 text-xs">{c.telefono}</td>
                <td className="px-6 py-4">
                  {c.rif ? (
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-700">{c.rif}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${rifStatus.color}`}>
                        {RifIcon && <RifIcon size={10} />} {rifStatus.label}
                      </span>
                    </div>
                  ) : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-6 py-4">
                  {c.licencia_documento ? (
                    <div>
                      <span className="text-xs font-bold text-slate-700">{c.licencia_documento}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${licStatus.color}`}>
                        {LicIcon && <LicIcon size={10} />} {licStatus.label}
                      </span>
                    </div>
                  ) : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-6 py-4">
                  {c.certificado_documento ? (
                    <div>
                      <span className="text-xs font-bold text-slate-700">{c.certificado_documento}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${certStatus.color}`}>
                        {CertIcon && <CertIcon size={10} />} {certStatus.label}
                      </span>
                    </div>
                  ) : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${c.estado === "activo" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                    {c.estado === "activo" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {c.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export { ChoferesTable };
export default ChoferesTable;
