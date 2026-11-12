"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight, ShieldCheck, Users, Package, UserCircle, FileText, ShoppingCart, Building2,
  Scale, Truck, Route, AlertCircle, CalendarDays,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { GERENCIA_MENU } from "@/components/gerencia-menu";
import { hoyLocal } from "@/lib/fecha";

interface Stats {
  clientes: number;
  proveedores: number;
  vendedores: number;
  facturas: number;
  ordenes: number;
  bancos: number;
}

interface Operacion {
  porCobrar: number;
  clientesConDeuda: number;
  viajesDespacho: number;
  m3Despacho: number;
  viajesMP: number;
  cantidadMP: number;
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const num = (v: number, dec = 0) => Number(v || 0).toLocaleString("es-VE", { minimumFractionDigits: dec, maximumFractionDigits: dec });

function saludo() {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

function fechaLarga() {
  const [y, m, d] = hoyLocal().split("-").map(Number);
  const f = new Date(y, m - 1, d);
  const t = `${DIAS[f.getDay()]}, ${d} de ${MESES[m - 1]} de ${y}`;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default function GerenciaPage() {
  const { session } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [op, setOp] = useState<Operacion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hoy = hoyLocal();
    Promise.all([
      fetch("/api/stats").then((r) => r.json()).catch(() => null),
      fetch("/api/estado-cuenta").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`/api/historico-viajes?periodo=diario&from=${hoy}&to=${hoy}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([s, ec, hv]) => {
      if (s?.success) setStats(s.stats);
      const clientes: any[] = ec?.clientes || [];
      setOp({
        porCobrar: clientes.reduce((acc, c) => acc + Math.max(Number(c.saldo || 0), 0), 0),
        clientesConDeuda: clientes.filter((c) => Number(c.saldo || 0) > 0.01).length,
        viajesDespacho: hv?.totales?.viajesDespacho || 0,
        m3Despacho: hv?.totales?.m3Despacho || 0,
        viajesMP: hv?.totales?.viajesMP || 0,
        cantidadMP: hv?.totales?.cantidadMP || 0,
      });
    }).finally(() => setLoading(false));
  }, []);

  const nombre = (session?.user.nombre || "").split(" ")[0];

  const kpisOperacion = [
    { label: "Por cobrar", valor: `Bs. ${num(op?.porCobrar || 0, 2)}`, detalle: `${op?.clientesConDeuda || 0} clientes con saldo pendiente`, icon: Scale, tono: "text-rose-600 bg-rose-50", href: "/gerencia/estado-cuenta" },
    { label: "Despachos hoy", valor: `${num(op?.viajesDespacho || 0)}`, detalle: `${num(op?.m3Despacho || 0, 2)} M³ despachados`, icon: Truck, tono: "text-sky-600 bg-sky-50", href: "/gerencia/historico-viajes" },
    { label: "Viajes de materia prima hoy", valor: `${num(op?.viajesMP || 0)}`, detalle: `${num(op?.cantidadMP || 0, 2)} recibidos`, icon: Route, tono: "text-orange-600 bg-orange-50", href: "/gerencia/viajes-materia-prima" },
    { label: "Alertas", valor: "Revisar", detalle: "Vencimientos de choferes, unidades y stock", icon: AlertCircle, tono: "text-amber-600 bg-amber-50", href: "/gerencia/alerta" },
  ];

  const kpisRegistro = [
    { label: "Clientes", valor: stats?.clientes, icon: Users, href: "/gerencia/clientes" },
    { label: "Proveedores", valor: stats?.proveedores, icon: Package, href: "/gerencia/proveedores" },
    { label: "Vendedores", valor: stats?.vendedores, icon: UserCircle, href: "/gerencia/vendedores" },
    { label: "Facturas", valor: stats?.facturas, icon: FileText, href: "/gerencia/facturas" },
    { label: "Órdenes de compra", valor: stats?.ordenes, icon: ShoppingCart, href: "/gerencia/ordenes-compra" },
    { label: "Cuentas bancarias", valor: stats?.bancos, icon: Building2, href: "/gerencia/bancos" },
  ];

  const secciones = GERENCIA_MENU.map((s) => ({ ...s, items: s.items.filter((i) => i.id !== "dashboard") }))
    .filter((s) => s.items.length > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Encabezado */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0B1020] px-6 py-7 md:px-8 md:py-8 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_120%_at_100%_0%,rgba(139,92,246,0.35),transparent_60%),radial-gradient(60%_80%_at_0%_100%,rgba(217,70,239,0.15),transparent_60%)]" />
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-violet-200/80">
              <CalendarDays size={13} /> {fechaLarga()}
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">
              {saludo()}{nombre ? `, ${nombre}` : ""}
            </h1>
            <p className="mt-1.5 text-sm text-slate-300 max-w-xl">
              Panel de Gerencia con acceso total: podés consultar, crear, editar y eliminar en todos los módulos.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-violet-100 ring-1 ring-inset ring-white/15 backdrop-blur">
            <ShieldCheck size={14} /> Acceso total
          </span>
        </div>
      </section>

      {/* Operación */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Operación</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpisOperacion.map((k) => (
            <Link key={k.label} href={k.href}
              className="group relative rounded-2xl bg-white p-5 ring-1 ring-slate-200/70 shadow-sm hover:shadow-md hover:ring-slate-300 transition-all">
              <div className="flex items-start justify-between">
                <span className={`h-10 w-10 rounded-xl flex items-center justify-center ${k.tono}`}><k.icon size={19} /></span>
                <ArrowUpRight size={16} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
              <p className="mt-4 text-[13px] font-medium text-slate-500">{k.label}</p>
              {loading ? (
                <div className="mt-1.5 h-7 w-28 rounded bg-slate-100 animate-pulse" />
              ) : (
                <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">{k.valor}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">{k.detalle}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Registros */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Registros</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-px rounded-2xl bg-slate-200/70 ring-1 ring-slate-200/70 shadow-sm overflow-hidden">
          {kpisRegistro.map((k) => (
            <Link key={k.label} href={k.href} className="group bg-white p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2 text-slate-400 group-hover:text-violet-600 transition-colors">
                <k.icon size={15} />
                <span className="text-xs font-medium">{k.label}</span>
              </div>
              {loading ? (
                <div className="mt-2 h-6 w-12 rounded bg-slate-100 animate-pulse" />
              ) : (
                <p className="mt-1.5 text-xl font-bold text-slate-900 tabular-nums">{num(k.valor ?? 0)}</p>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Accesos por sección */}
      <section className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Módulos</h2>
        {secciones.map((s) => (
          <div key={s.id}>
            <div className="mb-3 flex items-center gap-2">
              <span className={`h-7 w-7 rounded-lg flex items-center justify-center ${s.tono.fondo} ${s.tono.texto}`}><s.icon size={15} /></span>
              <h3 className="text-sm font-semibold text-slate-800">{s.label}</h3>
              <span className="text-xs text-slate-400">· {s.items.length}</span>
              <div className="ml-2 h-px flex-1 bg-slate-200/70" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {s.items.map((m) => (
                <Link key={m.id} href={m.href}
                  className="group flex items-center gap-3 rounded-xl bg-white p-3.5 ring-1 ring-slate-200/70 hover:ring-violet-300 hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <span className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${s.tono.fondo} ${s.tono.texto}`}>
                    <m.icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{m.label}</p>
                    <p className="text-xs text-slate-400 truncate">{m.descripcion}</p>
                  </div>
                  <ArrowUpRight size={15} className="shrink-0 text-slate-300 group-hover:text-violet-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
