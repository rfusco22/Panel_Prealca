"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, XCircle, Loader2, Shield } from "lucide-react";

export default function AlertaChoferesPage() {
  const [alertas, setAlertas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/choferes/alertas");
        if (!res.ok) throw new Error("Error");
        const data = await res.json();
        setAlertas(data.alertas || []);
      } catch {
        setAlertas([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getDocStatus = (fecha: string | null, label: string) => {
    if (!fecha) return null;
    const d = new Date(fecha);
    const ahora = new Date();
    const diff = d.getTime() - ahora.getTime();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (dias < 0) return { label: `${label} VENCIDO hace ${Math.abs(dias)} días`, color: "bg-red-600 text-white shadow-lg shadow-red-200", icon: XCircle, pulse: false, urgente: true };
    if (dias <= 7) return { label: `${label} vence en ${dias} días`, color: "bg-amber-400 text-red-900 shadow-md", icon: AlertTriangle, pulse: false, urgente: true };
    return null;
  };

  const totalAlertas = alertas.reduce((acc, a) => {
    const lic = getDocStatus(a.licencia_vencimiento, "Licencia");
    const cert = getDocStatus(a.certificado_vencimiento, "Cert. Médico");
    const rif = getDocStatus(a.rif_vencimiento, "RIF");
    return acc + (lic ? 1 : 0) + (cert ? 1 : 0) + (rif ? 1 : 0);
  }, 0);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Alertas de Documentos</h1>
        <p className="text-slate-500 mt-1">Choferes con documentos vencidos o por vencer en ≤ 7 días.</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <Loader2 size={24} className="animate-spin text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-sm">Cargando alertas...</p>
        </div>
      ) : alertas.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <div className="bg-emerald-100 text-emerald-500 p-4 rounded-full mx-auto mb-4 w-fit">
            <Shield size={40} />
          </div>
          <p className="text-lg font-bold text-slate-900 mb-1">Todo en orden</p>
          <p className="text-slate-500 font-medium">No hay documentos de choferes vencidos ni por vencer.</p>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl shadow-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  <AlertTriangle size={32} strokeWidth={3} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">¡ALERTA!</h2>
                  <p className="text-red-100 font-bold mt-0.5">{totalAlertas} documento(s) con problema(s) en {alertas.length} chofer(es)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {alertas.map((a) => {
              const licBadge = getDocStatus(a.licencia_vencimiento, "Licencia");
              const certBadge = getDocStatus(a.certificado_vencimiento, "Cert. Médico");
              const rifBadge = getDocStatus(a.rif_vencimiento, "RIF");
              const badges = [licBadge, certBadge, rifBadge].filter(Boolean);

              return (
                <div key={a.id} className="bg-white border-2 border-red-200 rounded-2xl overflow-hidden shadow-lg shadow-red-50 hover:shadow-xl hover:shadow-red-100 transition-shadow">
                  <div className="bg-red-50 border-b border-red-100 px-6 py-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-sm font-black text-white shadow-md">
                      {a.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-slate-900 text-lg">{a.nombre}</p>
                      <p className="text-sm font-bold text-slate-500">{a.cedula}</p>
                    </div>
                  </div>
                  <div className="px-6 py-4 flex flex-wrap gap-3">
                    {badges.map((b, i) => {
                      const BadgeIcon = b!.icon;
                      return (
                        <div key={i} className={`flex items-center gap-2 text-sm font-black px-4 py-2.5 rounded-xl ${b!.color}`}>
                          <BadgeIcon size={18} strokeWidth={3} />
                          {b!.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
