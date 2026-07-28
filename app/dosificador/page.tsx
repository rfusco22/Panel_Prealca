"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, AlertTriangle, Package, FileText, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

export default function DosificadorDashboard() {
  const [stats, setStats] = useState({ guias: 0, materiaPrima: 0, alertas: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [guiasRes, mpRes, alertaRes] = await Promise.all([
          fetch("/api/guia-despacho"),
          fetch("/api/materia-prima"),
          fetch("/api/alerta"),
        ]);
        if (guiasRes.ok) {
          const g = await guiasRes.json();
          setStats(s => ({ ...s, guias: Array.isArray(g) ? g.length : (g.guias || g.data || []).length }));
        }
        if (mpRes.ok) {
          const m = await mpRes.json();
          setStats(s => ({ ...s, materiaPrima: Array.isArray(m) ? m.length : (m.materiaPrima || m.data || []).length }));
        }
        if (alertaRes.ok) {
          const a = await alertaRes.json();
          setStats(s => ({ ...s, alertas: (a.productos || []).length }));
        }
      } catch {}
    };
    fetchStats();
  }, []);

  const modules = [
    { title: "Alerta", description: "Productos con stock bajo 200 M³", href: "/dosificador/alerta", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
    { title: "Materia Prima", description: "Registrar cantidades de agregados", href: "/dosificador/materia-prima", icon: Package, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    { title: "Guías de Despacho", description: "Crear y gestionar guías", href: "/dosificador/guia-despacho", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Vista general del flujo de materiales.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Guías del Mes", value: stats.guias, icon: FileText, color: "text-emerald-600" },
          { label: "Materia Prima", value: stats.materiaPrima, icon: Package, color: "text-blue-600" },
          { label: "Alertas Activas", value: stats.alertas, icon: AlertTriangle, color: stats.alertas > 0 ? "text-red-600" : "text-slate-900" },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
              <s.icon size={18} className={s.color} />
            </div>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Módulos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {modules.map((m) => (
            <Link key={m.href} href={m.href}>
              <div className={`bg-white border ${m.border} rounded-2xl p-6 hover:shadow-md transition-all cursor-pointer group`}>
                <div className={`${m.bg} ${m.color} p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform`}>
                  <m.icon size={24} />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{m.title}</h3>
                <p className="text-sm text-slate-500">{m.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
