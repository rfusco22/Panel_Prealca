"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Truck, Wrench, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useSocket } from '@/contexts/SocketContext';
import { diasHasta } from '@/lib/fecha';

export default function SeguridadVialDashboard() {
  const { socket } = useSocket();
  const [stats, setStats] = useState({ choferes: 0, unidades: 0, mantenimientosProximos: 0 });

  const fetchStats = useCallback(async () => {
    try {
      const [chRes, unRes] = await Promise.all([
        fetch("/api/choferes"),
        fetch("/api/unidades"),
      ]);
      if (chRes.ok) {
        const ch = await chRes.json();
        setStats(s => ({ ...s, choferes: (Array.isArray(ch) ? ch : (ch.choferes || ch.data || [])).length }));
      }
      if (unRes.ok) {
        const un = await unRes.json();
        const unidades = Array.isArray(un) ? un : (un.unidades || un.data || []);
        // "Próximo" incluye vencidos: son los que ya necesitaban atención y no
        // se cargaron todavía.
        const proximos = unidades.filter((u: any) => {
          const dias = diasHasta(u.proximoMantenimiento);
          return dias !== null && dias <= 7;
        }).length;
        setStats(s => ({ ...s, unidades: unidades.length, mantenimientosProximos: proximos }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchStats();
    };

    socket.on('choferes:created', handleUpdate);
    socket.on('choferes:updated', handleUpdate);
    socket.on('choferes:deleted', handleUpdate);
    socket.on('unidades:created', handleUpdate);
    socket.on('unidades:updated', handleUpdate);
    socket.on('unidades:deleted', handleUpdate);
    socket.on('mantenimientos:created', handleUpdate);
    socket.on('mantenimientos:updated', handleUpdate);
    socket.on('mantenimientos:deleted', handleUpdate);

    return () => {
      socket.off('choferes:created', handleUpdate);
      socket.off('choferes:updated', handleUpdate);
      socket.off('choferes:deleted', handleUpdate);
      socket.off('unidades:created', handleUpdate);
      socket.off('unidades:updated', handleUpdate);
      socket.off('unidades:deleted', handleUpdate);
      socket.off('mantenimientos:created', handleUpdate);
      socket.off('mantenimientos:updated', handleUpdate);
      socket.off('mantenimientos:deleted', handleUpdate);
    };
  }, [socket, fetchStats]);

  const modules = [
    { title: "Choferes", description: "Registro de choferes y sus documentos", href: "/seguridad-vial/choferes", icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    { title: "Unidades", description: "Control de unidades de transporte", href: "/seguridad-vial/unidades", icon: Truck, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
    { title: "Mantenimiento", description: "Registro de mantenimientos por unidad", href: "/seguridad-vial/mantenimiento-unidades", icon: Wrench, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Vista general de choferes, unidades y mantenimiento.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Choferes Registrados", value: stats.choferes, icon: Users, color: "text-blue-600" },
          { label: "Unidades", value: stats.unidades, icon: Truck, color: "text-purple-600" },
          { label: "Mantenimientos Próximos", value: stats.mantenimientosProximos, icon: AlertTriangle, color: stats.mantenimientosProximos > 0 ? "text-red-600" : "text-slate-900" },
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
