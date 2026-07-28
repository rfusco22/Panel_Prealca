"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import {
  Users, Package, UserCircle, FileText, ShoppingCart, Building2,
  TrendingUp, TrendingDown, Loader2
} from "lucide-react";

interface Stats {
  clientes: number;
  proveedores: number;
  vendedores: number;
  facturas: number;
  ordenes: number;
  bancos: number;
}

export default function RegistroPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchStats = () => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => { if (d.success) setStats(d.stats); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchStats();
    };

    socket.on("proveedores:created", handleUpdate);
    socket.on("proveedores:updated", handleUpdate);
    socket.on("proveedores:deleted", handleUpdate);
    socket.on("clientes:created", handleUpdate);
    socket.on("vendedores:created", handleUpdate);
    socket.on("facturas:created", handleUpdate);
    socket.on("orden-compra:created", handleUpdate);
    socket.on("orden-compra:deleted", handleUpdate);
    socket.on("bancos:created", handleUpdate);
    socket.on("bancos:updated", handleUpdate);
    socket.on("bancos:deleted", handleUpdate);

    return () => {
      socket.off("proveedores:created", handleUpdate);
      socket.off("proveedores:updated", handleUpdate);
      socket.off("proveedores:deleted", handleUpdate);
      socket.off("clientes:created", handleUpdate);
      socket.off("vendedores:created", handleUpdate);
      socket.off("facturas:created", handleUpdate);
      socket.off("orden-compra:created", handleUpdate);
      socket.off("orden-compra:deleted", handleUpdate);
      socket.off("bancos:created", handleUpdate);
      socket.off("bancos:updated", handleUpdate);
      socket.off("bancos:deleted", handleUpdate);
    };
  }, [socket]);

  const total = stats ? stats.clientes + stats.proveedores + stats.vendedores + stats.facturas + stats.ordenes + stats.bancos : 0;

  const cards = [
    {
      label: "Clientes Activos",
      value: stats?.clientes ?? 0,
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      barColor: "bg-emerald-500",
      percent: total > 0 ? Math.round(((stats?.clientes ?? 0) / total) * 100) : 0,
      trend: "+12%",
      trendUp: true,
      subtitle: "Directorio completo",
    },
    {
      label: "Proveedores",
      value: stats?.proveedores ?? 0,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
      barColor: "bg-blue-500",
      percent: total > 0 ? Math.round(((stats?.proveedores ?? 0) / total) * 100) : 0,
      trend: "+5%",
      trendUp: true,
      subtitle: "Registros activos",
    },
    {
      label: "Vendedores",
      value: stats?.vendedores ?? 0,
      icon: UserCircle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      barColor: "bg-amber-500",
      percent: total > 0 ? Math.round(((stats?.vendedores ?? 0) / total) * 100) : 0,
      trend: "+3%",
      trendUp: true,
      subtitle: "Equipo de ventas",
    },
    {
      label: "Facturas Emitidas",
      value: stats?.facturas ?? 0,
      icon: FileText,
      color: "text-red-600",
      bg: "bg-red-50",
      barColor: "bg-red-500",
      percent: total > 0 ? Math.round(((stats?.facturas ?? 0) / total) * 100) : 0,
      trend: "0%",
      trendUp: false,
      subtitle: "Documentos contables",
    },
    {
      label: "Órdenes de Compra",
      value: stats?.ordenes ?? 0,
      icon: ShoppingCart,
      color: "text-teal-600",
      bg: "bg-teal-50",
      barColor: "bg-teal-500",
      percent: total > 0 ? Math.round(((stats?.ordenes ?? 0) / total) * 100) : 0,
      trend: "0%",
      trendUp: false,
      subtitle: "Órdenes registradas",
    },
    {
      label: "Cuentas Bancarias",
      value: stats?.bancos ?? 0,
      icon: Building2,
      color: "text-purple-600",
      bg: "bg-purple-50",
      barColor: "bg-purple-500",
      percent: total > 0 ? Math.round(((stats?.bancos ?? 0) / total) * 100) : 0,
      trend: "0%",
      trendUp: false,
      subtitle: "Cuentas activas",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Panel de Registro</h1>
          <p className="text-slate-500 mt-1">Resumen general del sistema con datos en tiempo real.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-white border border-slate-200 rounded-lg px-3 py-2">
          <TrendingUp size={14} />
          {loading ? "Cargando datos..." : `${total} registros totales`}
        </div>
      </div>

      {/* RESUMEN GENERAL */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Resumen General</h2>
          <span className="text-xs font-semibold text-slate-400">{total} registros</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 gap-1">
          {cards.map((c, i) => (
            <div
              key={i}
              className={`${c.barColor} rounded-full transition-all duration-700`}
              style={{ width: `${c.percent}%` }}
              title={`${c.label}: ${c.value}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          {cards.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
              <div className={`w-2.5 h-2.5 rounded-full ${c.barColor}`} />
              {c.label}: {c.value}
            </div>
          ))}
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                <div className="h-3 w-24 bg-slate-100 rounded" />
              </div>
              <div className="h-8 w-16 bg-slate-100 rounded mb-3" />
              <div className="h-2 w-full bg-slate-100 rounded-full" />
            </div>
          ))
        ) : (
          cards.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-[10px] text-slate-300 mt-0.5">{stat.subtitle}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.trendUp ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-50'}`}>
                  {stat.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {stat.trend}
                </div>
              </div>

              <h3 className="text-3xl font-black text-slate-900 mb-3">{stat.value}</h3>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                  <span>Del total</span>
                  <span>{stat.percent}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stat.barColor} rounded-full transition-all duration-700`}
                    style={{ width: `${stat.percent}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
