"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, Search, X, ChevronsDownUp, ChevronsUpDown, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { GERENCIA_MENU, esRutaActiva, type GerenciaMenuSection } from "@/components/gerencia-menu";

// Sidebar de Gerencia.
//
// Secciones por área (Principal, Comercial, Finanzas, Compras, Producción,
// Logística, Administración) que se despliegan y pliegan. La sección de la
// página actual se abre sola, y qué secciones dejó abiertas el usuario se
// recuerda en el navegador. Con el buscador se filtran las opciones de todas
// las secciones a la vez.

const CLAVE_STORAGE = "gerencia-sidebar-abiertas";
const ABIERTAS_POR_DEFECTO = ["principal"];

const iniciales = (n: string) =>
  (n || "G").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");

function useSeccionesAbiertas(pathname: string) {
  const [abiertas, setAbiertas] = useState<string[]>(ABIERTAS_POR_DEFECTO);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_STORAGE);
      if (guardado) setAbiertas(JSON.parse(guardado));
    } catch {}
    setCargado(true);
  }, []);

  // La sección de la página actual siempre queda abierta.
  useEffect(() => {
    const actual = GERENCIA_MENU.find((s) => s.items.some((i) => esRutaActiva(pathname, i.href)));
    if (actual) setAbiertas((a) => (a.includes(actual.id) ? a : [...a, actual.id]));
  }, [pathname]);

  useEffect(() => {
    if (!cargado) return;
    try { localStorage.setItem(CLAVE_STORAGE, JSON.stringify(abiertas)); } catch {}
  }, [abiertas, cargado]);

  const alternar = (id: string) => setAbiertas((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const todas = () => setAbiertas(GERENCIA_MENU.map((s) => s.id));
  const ninguna = () => setAbiertas([]);
  return { abiertas, alternar, todas, ninguna };
}

function NavSecciones({
  pathname, colapsado, onNavegar,
}: { pathname: string; colapsado: boolean; onNavegar?: () => void }) {
  const { abiertas, alternar, todas, ninguna } = useSeccionesAbiertas(pathname);
  const [busqueda, setBusqueda] = useState("");
  const q = busqueda.trim().toLowerCase();

  const secciones: GerenciaMenuSection[] = useMemo(() => {
    if (!q) return GERENCIA_MENU;
    return GERENCIA_MENU
      .map((s) => ({ ...s, items: s.items.filter((i) => i.label.toLowerCase().includes(q) || s.label.toLowerCase().includes(q)) }))
      .filter((s) => s.items.length > 0);
  }, [q]);

  const todasAbiertas = abiertas.length >= GERENCIA_MENU.length;

  // ── Riel colapsado: solo íconos, con un separador entre secciones ──
  if (colapsado) {
    return (
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-1 scrollbar-none">
        {GERENCIA_MENU.map((s, idx) => (
          <div key={s.id} className="flex flex-col items-center gap-1">
            {idx > 0 && <div className="w-8 h-px bg-white/10 my-2" />}
            {s.items.map((item) => {
              const activo = esRutaActiva(pathname, item.href);
              return (
                <Link key={item.id} href={item.href} title={`${s.label} · ${item.label}`} onClick={onNavegar}
                  className={`relative h-10 w-10 flex items-center justify-center rounded-xl transition-all ${
                    activo ? "bg-violet-500/15 text-violet-300 shadow-[inset_0_0_0_1px_rgba(167,139,250,0.35)]" : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                  }`}>
                  <item.icon size={18} />
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    );
  }

  return (
    <>
      {/* Buscador + expandir/contraer */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <div className="flex-1 min-w-0 flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1.5 focus-within:border-violet-400/40 transition-colors">
          <Search size={14} className="text-slate-500 shrink-0" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar módulo..."
            className="flex-1 min-w-0 bg-transparent text-[13px] text-slate-200 placeholder:text-slate-500 outline-none"
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")} className="text-slate-500 hover:text-slate-200"><X size={13} /></button>
          )}
        </div>
        <button
          onClick={todasAbiertas ? ninguna : todas}
          title={todasAbiertas ? "Contraer todas las secciones" : "Expandir todas las secciones"}
          className="h-[30px] w-[30px] shrink-0 flex items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          {todasAbiertas ? <ChevronsDownUp size={14} /> : <ChevronsUpDown size={14} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 space-y-1 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.2)_transparent]">
        {secciones.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-slate-500">Sin resultados para “{busqueda}”.</p>
        )}
        {secciones.map((s) => {
          const abierta = q ? true : abiertas.includes(s.id);
          const tieneActivo = s.items.some((i) => esRutaActiva(pathname, i.href));
          return (
            <div key={s.id} className={`rounded-xl transition-colors ${abierta ? "bg-white/[0.02]" : ""}`}>
              <button
                onClick={() => !q && alternar(s.id)}
                aria-expanded={abierta}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl group hover:bg-white/[0.04] transition-colors"
              >
                <span className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                  tieneActivo ? "bg-violet-500/20 text-violet-300" : "bg-white/[0.05] text-slate-400 group-hover:text-slate-200"
                }`}>
                  <s.icon size={13} />
                </span>
                <span className={`flex-1 min-w-0 truncate text-left text-[11px] font-bold uppercase tracking-[0.1em] whitespace-nowrap ${
                  tieneActivo ? "text-violet-200" : "text-slate-400 group-hover:text-slate-200"
                }`}>
                  {s.label}
                </span>
                {!abierta && tieneActivo && <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />}
                <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${abierta ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence initial={false}>
                {abierta && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <ul className="relative ml-[23px] pl-3 pb-2 pt-0.5 border-l border-white/[0.07] space-y-0.5">
                      {s.items.map((item) => {
                        const activo = esRutaActiva(pathname, item.href);
                        return (
                          <li key={item.id}>
                            <Link href={item.href} onClick={onNavegar}
                              className={`relative flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-all ${
                                activo
                                  ? "bg-gradient-to-r from-violet-500/20 to-violet-500/5 text-white font-semibold"
                                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                              }`}>
                              {activo && <span className="absolute -left-[13px] top-1.5 bottom-1.5 w-[2px] rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />}
                              <item.icon size={15} className={activo ? "text-violet-300" : "text-slate-500"} />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>
    </>
  );
}

function Marca({ compacta }: { compacta: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${compacta ? "justify-center" : ""}`}>
      <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center p-1 shadow-lg shadow-violet-900/30 ring-1 ring-white/10 shrink-0">
        <Image src="/logo.jpeg" alt="PREALCA" width={44} height={44} style={{ width: "100%", height: "100%" }} className="object-contain" />
      </div>
      {!compacta && (
        <div className="min-w-0">
          <h2 className="font-extrabold text-lg leading-none tracking-[0.08em] text-white">PREALCA</h2>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300 ring-1 ring-inset ring-violet-400/20">
            <ShieldCheck size={10} /> Gerencia
          </span>
        </div>
      )}
    </div>
  );
}

function Usuario({ userName, compacto, onLogout }: { userName: string; compacto: boolean; onLogout: () => void }) {
  if (compacto) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white" title={userName}>
          {iniciales(userName)}
        </div>
        <button onClick={onLogout} title="Cerrar sesión" className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition">
          <LogOut size={16} />
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.06] p-2.5">
      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
        {iniciales(userName)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-white truncate">{userName}</p>
        <p className="text-[11px] text-slate-400 truncate">Gerencia · Acceso total</p>
      </div>
      <button onClick={onLogout} title="Cerrar sesión" className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition shrink-0">
        <LogOut size={16} />
      </button>
    </div>
  );
}

export function GerenciaSidebar({
  userName,
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
}: {
  userRole: string;
  userName: string;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/auth/login");
  };

  const fondo = "bg-[#0B1020] bg-[radial-gradient(120%_60%_at_0%_0%,rgba(139,92,246,0.14),transparent_60%)]";

  return (
    <>
      {/* Escritorio */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className={`${fondo} border-r border-white/[0.06] text-slate-300 hidden md:flex flex-col h-screen sticky top-0 overflow-hidden shrink-0`}
      >
        <div className={`h-20 flex items-center shrink-0 ${isCollapsed ? "justify-center" : "px-5"}`}>
          <Marca compacta={isCollapsed} />
        </div>
        <NavSecciones pathname={pathname} colapsado={isCollapsed} />
        <div className={`shrink-0 border-t border-white/[0.06] ${isCollapsed ? "py-3" : "p-3"}`}>
          <Usuario userName={userName} compacto={isCollapsed} onLogout={handleLogout} />
        </div>
      </motion.aside>

      {/* Móvil / tablet */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
              onClick={onCloseMobile}
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className={`${fondo} fixed inset-y-0 left-0 z-50 w-[300px] max-w-[85vw] border-r border-white/[0.06] text-slate-300 flex flex-col shadow-2xl md:hidden`}
            >
              <div className="h-20 flex items-center justify-between px-5 shrink-0">
                <Marca compacta={false} />
                <button onClick={onCloseMobile} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition" aria-label="Cerrar menú">
                  <X size={20} />
                </button>
              </div>
              <NavSecciones pathname={pathname} colapsado={false} onNavegar={onCloseMobile} />
              <div className="shrink-0 border-t border-white/[0.06] p-3">
                <Usuario userName={userName} compacto={false} onLogout={handleLogout} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
