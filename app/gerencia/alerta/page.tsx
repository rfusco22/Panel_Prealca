"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, XCircle } from "lucide-react";

export default function GerenciaAlertaPage() {
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/choferes/alertas")
      .then(res => res.json())
      .then(data => setAlertas(data.alertas || []))
      .catch(() => setAlertas([]))
      .finally(() => setLoading(false));
  }, []);

  const getDocStatus = (fecha: string | null, label: string) => {
    if (!fecha) return null;
    const d = new Date(fecha);
    const ahora = new Date();
    const diff = d.getTime() - ahora.getTime();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (dias < 0) return { label: `${label} VENCIDO hace ${Math.abs(dias)} días`, color: "bg-red-600 text-white", urgente: true };
    if (dias <= 7) return { label: `${label} vence en ${dias} días`, color: "bg-amber-400 text-red-900", urgente: true };
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Alertas de Choferes</h1>
        <p className="text-slate-500 mt-1">Documentos vencidos o próximos a vencer.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : alertas.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No hay alertas activas</div>
        ) : (
          <div className="space-y-3">
            {alertas.map((a, i) => {
              const lic = getDocStatus(a.licencia_vencimiento, "Licencia");
              const cert = getDocStatus(a.certificado_vencimiento, "Cert. Médico");
              if (!lic && !cert) return null;
              return (
                <div key={i} className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{a.nombre}</p>
                      <p className="text-xs text-slate-500">Cédula: {a.cedula || '-'}</p>
                    </div>
                    <div className="flex gap-2">
                      {lic && <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${lic.color}`}>{lic.label}</span>}
                      {cert && <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cert.color}`}>{cert.label}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
