'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, Send, Search, ArrowLeft, Users, Check, CheckCheck, Loader2, Hash } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { hoyLocal } from '@/lib/fecha';

// Chat interno en tiempo real. Los mensajes viajan por WebSocket (Socket.IO,
// eventos chat:*; ver server.ts) y el historial se pide a /api/chat/*.
// Está montado en el TopBar, así que aparece en todos los paneles.

type Key = string; // 'general' o el id del otro usuario como texto

interface Mensaje {
  id: number;
  tempId?: string | null;
  remitenteId: number;
  remitenteNombre: string | null;
  remitenteRol?: string | null;
  destinatarioId: number | null;
  contenido: string;
  leido: number;
  createdAt: string;
  pendiente?: boolean;
  error?: string;
}

interface Contacto {
  id: number;
  nombre: string;
  role: string;
  estado: string;
  noLeidos: number;
  ultimoMensaje: { id: number; remitenteId: number; contenido: string; createdAt: string } | null;
}

const ROLES: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'bg-blue-500' },
  gerencia: { label: 'Gerencia', color: 'bg-violet-500' },
  registro: { label: 'Registro', color: 'bg-sky-500' },
  dosificador: { label: 'Dosificador', color: 'bg-green-500' },
  'seguridad-vial': { label: 'Seguridad Vial', color: 'bg-amber-500' },
};

const iniciales = (n: string | null | undefined) =>
  (n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('');

const hora = (s: string) => (s && s.length >= 16 ? s.slice(11, 16) : '');

function etiquetaDia(s: string) {
  const dia = s.slice(0, 10);
  const hoy = hoyLocal();
  if (dia === hoy) return 'Hoy';
  const [y, m, d] = hoy.split('-').map(Number);
  const ayer = new Date(y, m - 1, d - 1);
  const ayerStr = `${ayer.getFullYear()}-${String(ayer.getMonth() + 1).padStart(2, '0')}-${String(ayer.getDate()).padStart(2, '0')}`;
  if (dia === ayerStr) return 'Ayer';
  const [yy, mm, dd] = dia.split('-');
  return `${dd}/${mm}/${yy}`;
}

function ahoraStr() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${hoyLocal()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function haceCuanto(ms: number | undefined) {
  if (!ms) return 'Desconectado';
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 1) return 'Visto hace un momento';
  if (min < 60) return `Visto hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Visto hace ${h} h`;
  return `Visto hace ${Math.round(h / 24)} d`;
}

export function ChatWidget() {
  const { socket, connected, onlineUserIds, lastSeen } = useSocket();
  const [abierto, setAbierto] = useState(false);
  const [yo, setYo] = useState<number | null>(null);
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [general, setGeneral] = useState<{ noLeidos: number; ultimoMensaje: any }>({ noLeidos: 0, ultimoMensaje: null });
  const [activo, setActivo] = useState<Key | null>(null);
  const [mensajes, setMensajes] = useState<Record<Key, Mensaje[]>>({});
  const [hayMas, setHayMas] = useState<Record<Key, boolean>>({});
  const [cargando, setCargando] = useState(false);
  const [texto, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [escribiendo, setEscribiendo] = useState<Record<Key, { from: number; hasta: number }>>({});
  const [, forzar] = useState(0);

  const finRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingEnviado = useRef(false);
  // Referencias "vivas" para los listeners del socket
  const estadoRef = useRef({ abierto, activo, yo });
  estadoRef.current = { abierto, activo, yo };

  const nombres = useMemo(() => {
    const m = new Map<number, string>();
    contactos.forEach((c) => m.set(c.id, c.nombre));
    return m;
  }, [contactos]);

  const totalNoLeidos = general.noLeidos + contactos.reduce((s, c) => s + c.noLeidos, 0);

  const cargarContactos = useCallback(async () => {
    try {
      const r = await fetch('/api/chat/contactos');
      if (!r.ok) return;
      const d = await r.json();
      setYo(d.yo);
      setContactos(d.contactos || []);
      setGeneral(d.general || { noLeidos: 0, ultimoMensaje: null });
    } catch {}
  }, []);

  useEffect(() => { cargarContactos(); }, [cargarContactos]);
  // Al reconectar se resincroniza por si llegaron mensajes mientras tanto.
  useEffect(() => { if (connected) cargarContactos(); }, [connected, cargarContactos]);

  const marcarLeido = useCallback((key: Key) => {
    if (key === 'general') setGeneral((g) => ({ ...g, noLeidos: 0 }));
    else setContactos((cs) => cs.map((c) => (String(c.id) === key ? { ...c, noLeidos: 0 } : c)));
    socket?.emit('chat:read', { con: key === 'general' ? null : Number(key) });
  }, [socket]);

  const cargarMensajes = useCallback(async (key: Key, antes?: number) => {
    setCargando(true);
    try {
      const params = new URLSearchParams({ con: key });
      if (antes) params.set('antes', String(antes));
      const r = await fetch(`/api/chat/mensajes?${params}`);
      const d = await r.json();
      if (!r.ok) return;
      setMensajes((prev) => {
        const existentes = antes ? prev[key] || [] : [];
        const ids = new Set(existentes.map((m) => m.id));
        return { ...prev, [key]: [...(d.mensajes as Mensaje[]).filter((m) => !ids.has(m.id)), ...existentes] };
      });
      setHayMas((h) => ({ ...h, [key]: !!d.hayMas }));
    } catch {} finally { setCargando(false); }
  }, []);

  // ── Eventos del socket ──
  useEffect(() => {
    if (!socket) return;

    const onMessage = (m: Mensaje) => {
      const { abierto: ab, activo: act, yo: me } = estadoRef.current;
      const mio = me !== null && m.remitenteId === me;
      const key: Key = m.destinatarioId === null ? 'general' : String(mio ? m.destinatarioId : m.remitenteId);

      setMensajes((prev) => {
        if (!prev[key]) return prev; // conversación no cargada: se pedirá al abrirla
        const lista = prev[key];
        if (lista.some((x) => x.id === m.id)) return prev;
        const i = m.tempId ? lista.findIndex((x) => x.tempId === m.tempId) : -1;
        if (i >= 0) {
          const copia = [...lista];
          copia[i] = { ...m, pendiente: false };
          return { ...prev, [key]: copia };
        }
        return { ...prev, [key]: [...lista, m] };
      });

      const ultimo = { id: m.id, remitenteId: m.remitenteId, remitenteNombre: m.remitenteNombre, contenido: m.contenido, createdAt: m.createdAt };
      const viendo = ab && act === key && typeof document !== 'undefined' && document.visibilityState === 'visible';
      if (key === 'general') {
        setGeneral((g) => ({ ultimoMensaje: ultimo, noLeidos: !mio && !viendo ? g.noLeidos + 1 : g.noLeidos }));
      } else {
        setContactos((cs) => cs.map((c) => (String(c.id) === key
          ? { ...c, ultimoMensaje: ultimo, noLeidos: !mio && !viendo ? c.noLeidos + 1 : c.noLeidos }
          : c)));
      }
      if (!mio && viendo) socket.emit('chat:read', { con: key === 'general' ? null : Number(key) });
      if (!mio) setEscribiendo((e) => { const c = { ...e }; delete c[key]; return c; });
    };

    const onTyping = (p: { from: number; to: number | null; typing: boolean }) => {
      const key: Key = p.to === null ? 'general' : String(p.from);
      setEscribiendo((e) => {
        const c = { ...e };
        if (p.typing) c[key] = { from: p.from, hasta: Date.now() + 5000 };
        else delete c[key];
        return c;
      });
    };

    const onRead = (p: { by: number }) => {
      const key = String(p.by);
      setMensajes((prev) => (prev[key]
        ? { ...prev, [key]: prev[key].map((m) => (m.destinatarioId === p.by ? { ...m, leido: 1 } : m)) }
        : prev));
    };

    const onUnreadChanged = (p: { con: number | null }) => {
      const key = p.con === null ? 'general' : String(p.con);
      if (key === 'general') setGeneral((g) => ({ ...g, noLeidos: 0 }));
      else setContactos((cs) => cs.map((c) => (String(c.id) === key ? { ...c, noLeidos: 0 } : c)));
    };

    socket.on('chat:message', onMessage);
    socket.on('chat:typing', onTyping);
    socket.on('chat:read', onRead);
    socket.on('chat:unread-changed', onUnreadChanged);
    return () => {
      socket.off('chat:message', onMessage);
      socket.off('chat:typing', onTyping);
      socket.off('chat:read', onRead);
      socket.off('chat:unread-changed', onUnreadChanged);
    };
  }, [socket]);

  // Vence los "escribiendo..." que quedaron colgados
  useEffect(() => {
    const t = setInterval(() => {
      setEscribiendo((e) => {
        const ahora = Date.now();
        const vivos = Object.entries(e).filter(([, v]) => v.hasta > ahora);
        return vivos.length === Object.keys(e).length ? e : Object.fromEntries(vivos);
      });
      forzar((n) => n + 1); // refresca los "visto hace..."
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // Abrir conversación
  useEffect(() => {
    if (!abierto || !activo) return;
    if (!mensajes[activo]) cargarMensajes(activo);
    marcarLeido(activo);
    setTimeout(() => inputRef.current?.focus(), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, activo]);

  // Auto-scroll al final cuando llegan mensajes
  const listaActiva = activo ? mensajes[activo] : undefined;
  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end' });
  }, [listaActiva?.length, activo, abierto]);

  // Cerrar con Escape
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [abierto]);

  const avisarEscribiendo = (valor: string) => {
    if (!socket || !activo) return;
    const to = activo === 'general' ? null : Number(activo);
    if (valor && !typingEnviado.current) {
      socket.emit('chat:typing', { to, typing: true });
      typingEnviado.current = true;
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('chat:typing', { to, typing: false });
      typingEnviado.current = false;
    }, valor ? 2500 : 0);
  };

  const enviar = async () => {
    const contenido = texto.trim();
    if (!contenido || !activo || yo === null) return;
    const key = activo;
    const to = key === 'general' ? null : Number(key);
    const tempId = `t${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    const temporal: Mensaje = {
      id: -Date.now(), tempId, remitenteId: yo, remitenteNombre: 'Yo', destinatarioId: to,
      contenido, leido: 0, createdAt: ahoraStr(), pendiente: true,
    };
    setMensajes((prev) => ({ ...prev, [key]: [...(prev[key] || []), temporal] }));
    setTexto('');
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (typingEnviado.current) { socket?.emit('chat:typing', { to, typing: false }); typingEnviado.current = false; }

    const reemplazar = (r: { ok: boolean; mensaje?: Mensaje; error?: string }) => {
      setMensajes((prev) => {
        const lista = prev[key] || [];
        if (r.ok && r.mensaje && lista.some((x) => x.id === r.mensaje!.id)) {
          return { ...prev, [key]: lista.filter((x) => x.tempId !== tempId || x.id === r.mensaje!.id) };
        }
        return {
          ...prev,
          [key]: lista.map((x) => (x.tempId === tempId
            ? (r.ok && r.mensaje ? { ...r.mensaje, tempId, pendiente: false } : { ...x, pendiente: false, error: r.error || 'No enviado' })
            : x)),
        };
      });
    };

    if (socket && connected) {
      socket.timeout(10000).emit('chat:send', { to, contenido, tempId }, (err: any, r: any) => {
        reemplazar(err ? { ok: false, error: 'Sin respuesta del servidor' } : r);
      });
    } else {
      // Respaldo por HTTP si el WebSocket no está conectado
      try {
        const res = await fetch('/api/chat/mensajes', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: to ?? 'general', contenido }),
        });
        const d = await res.json();
        reemplazar(res.ok ? { ok: true, mensaje: d.mensaje } : { ok: false, error: d.error });
      } catch { reemplazar({ ok: false, error: 'Sin conexión' }); }
    }
  };

  const contactosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return [...contactos]
      .filter((c) => !q || c.nombre.toLowerCase().includes(q) || (ROLES[c.role]?.label || c.role).toLowerCase().includes(q))
      .sort((a, b) => {
        const ua = a.ultimoMensaje?.id || 0, ub = b.ultimoMensaje?.id || 0;
        if (ua !== ub) return ub - ua;
        const oa = onlineUserIds.includes(a.id) ? 1 : 0, ob = onlineUserIds.includes(b.id) ? 1 : 0;
        if (oa !== ob) return ob - oa;
        return a.nombre.localeCompare(b.nombre);
      });
  }, [contactos, busqueda, onlineUserIds]);

  const contactoActivo = activo && activo !== 'general' ? contactos.find((c) => String(c.id) === activo) : null;
  const enLinea = (id: number) => onlineUserIds.includes(id);
  const typingActivo = activo ? escribiendo[activo] : undefined;

  const Avatar = ({ nombre, role, online, size = 'h-10 w-10' }: { nombre: string; role?: string; online?: boolean; size?: string }) => (
    <div className="relative shrink-0">
      <div className={`${size} rounded-full ${ROLES[role || '']?.color || 'bg-slate-400'} text-white flex items-center justify-center text-xs font-bold`}>{iniciales(nombre)}</div>
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      )}
    </div>
  );

  // ── Render ──
  return (
    <>
      <button
        onClick={() => setAbierto((a) => !a)}
        className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
        title="Chat"
        aria-label="Abrir chat"
      >
        <MessageCircle size={22} />
        {totalNoLeidos > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {totalNoLeidos > 99 ? '99+' : totalNoLeidos}
          </span>
        )}
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[60] inset-0 sm:inset-auto sm:top-[72px] sm:right-4 sm:w-[min(820px,calc(100vw-2rem))] sm:h-[min(620px,calc(100vh-6rem))] bg-white sm:rounded-2xl shadow-2xl border border-slate-200 flex overflow-hidden"
          >
            {/* Lista de conversaciones */}
            <aside className={`${activo ? 'hidden md:flex' : 'flex'} w-full md:w-72 flex-col border-r border-slate-100 bg-slate-50/60`}>
              <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 bg-white">
                <div>
                  <h2 className="font-bold text-slate-900">Chat</h2>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    {connected ? `${onlineUserIds.filter((id) => id !== yo).length} en línea` : 'Reconectando...'}
                  </p>
                </div>
                <button onClick={() => setAbierto(false)} className="p-1.5 hover:bg-slate-100 rounded-lg md:hidden"><X size={18} /></button>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                  <Search size={14} className="text-slate-400" />
                  <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar usuario..." className="flex-1 text-sm outline-none bg-transparent" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <button onClick={() => setActivo('general')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${activo === 'general' ? 'bg-indigo-50' : 'hover:bg-white'}`}>
                  <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0"><Hash size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="font-semibold text-sm text-slate-800">General</p>
                      {general.ultimoMensaje && <span className="text-[10px] text-slate-400">{hora(general.ultimoMensaje.createdAt)}</span>}
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {general.ultimoMensaje ? `${general.ultimoMensaje.remitenteId === yo ? 'Vos' : (general.ultimoMensaje.remitenteNombre || '').split(' ')[0]}: ${general.ultimoMensaje.contenido}` : 'Canal para todos los usuarios'}
                    </p>
                  </div>
                  {general.noLeidos > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">{general.noLeidos}</span>}
                </button>
                <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1"><Users size={11} /> Usuarios</p>
                {contactosFiltrados.map((c) => (
                  <button key={c.id} onClick={() => setActivo(String(c.id))}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${activo === String(c.id) ? 'bg-indigo-50' : 'hover:bg-white'}`}>
                    <Avatar nombre={c.nombre} role={c.role} online={enLinea(c.id)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <p className={`text-sm truncate ${c.noLeidos ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>{c.nombre}</p>
                        {c.ultimoMensaje && <span className="text-[10px] text-slate-400 shrink-0">{hora(c.ultimoMensaje.createdAt)}</span>}
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {escribiendo[String(c.id)] ? <span className="text-emerald-600 italic">escribiendo...</span>
                          : c.ultimoMensaje ? `${c.ultimoMensaje.remitenteId === yo ? 'Vos: ' : ''}${c.ultimoMensaje.contenido}`
                          : ROLES[c.role]?.label || c.role}
                      </p>
                    </div>
                    {c.noLeidos > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">{c.noLeidos}</span>}
                  </button>
                ))}
                {contactosFiltrados.length === 0 && <p className="px-4 py-6 text-center text-xs text-slate-400">Sin usuarios.</p>}
              </div>
            </aside>

            {/* Conversación */}
            <section className={`${activo ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0`}>
              {!activo ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 relative">
                  <button onClick={() => setAbierto(false)} className="absolute top-3 right-3 p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
                  <MessageCircle size={40} className="text-slate-300" />
                  <p className="text-sm">Elegí una conversación</p>
                </div>
              ) : (
                <>
                  <header className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                    <button onClick={() => setActivo(null)} className="p-1.5 hover:bg-slate-100 rounded-lg md:hidden"><ArrowLeft size={18} /></button>
                    {activo === 'general' ? (
                      <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center"><Hash size={16} /></div>
                    ) : (
                      <Avatar nombre={contactoActivo?.nombre || ''} role={contactoActivo?.role} online={contactoActivo ? enLinea(contactoActivo.id) : false} size="h-9 w-9" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{activo === 'general' ? 'General' : contactoActivo?.nombre}</p>
                      <p className="text-[11px] text-slate-500">
                        {typingActivo
                          ? <span className="text-emerald-600">{activo === 'general' ? `${nombres.get(typingActivo.from) || 'Alguien'} está escribiendo...` : 'escribiendo...'}</span>
                          : activo === 'general' ? `${contactos.length + 1} participantes`
                          : contactoActivo && (enLinea(contactoActivo.id) ? 'En línea' : haceCuanto(lastSeen[contactoActivo.id]))}
                        {contactoActivo && !typingActivo && <> · {ROLES[contactoActivo.role]?.label || contactoActivo.role}</>}
                      </p>
                    </div>
                    <button onClick={() => setAbierto(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
                  </header>

                  <div className="flex-1 overflow-y-auto px-4 py-3 bg-[#f6f7fb]">
                    {hayMas[activo] && (
                      <div className="text-center mb-2">
                        <button disabled={cargando} onClick={() => cargarMensajes(activo, listaActiva?.find((m) => m.id > 0)?.id)}
                          className="text-xs text-indigo-600 hover:underline disabled:opacity-50">Cargar mensajes anteriores</button>
                      </div>
                    )}
                    {cargando && !listaActiva && <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400" /></div>}
                    {listaActiva && listaActiva.length === 0 && (
                      <p className="text-center text-sm text-slate-400 py-10">No hay mensajes todavía. ¡Escribí el primero!</p>
                    )}
                    {listaActiva?.map((m, i) => {
                      const mio = m.remitenteId === yo;
                      const anterior = listaActiva[i - 1];
                      const nuevoDia = !anterior || anterior.createdAt.slice(0, 10) !== m.createdAt.slice(0, 10);
                      const agrupado = !nuevoDia && anterior && anterior.remitenteId === m.remitenteId;
                      return (
                        <div key={m.tempId || m.id}>
                          {nuevoDia && (
                            <div className="flex justify-center my-3">
                              <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-0.5">{etiquetaDia(m.createdAt)}</span>
                            </div>
                          )}
                          <div className={`flex ${mio ? 'justify-end' : 'justify-start'} ${agrupado ? 'mt-0.5' : 'mt-2'}`}>
                            <div className={`max-w-[78%] rounded-2xl px-3 py-1.5 shadow-sm ${mio ? 'bg-indigo-600 text-white rounded-br-md' : 'bg-white text-slate-800 rounded-bl-md'} ${m.error ? 'bg-red-100 text-red-800' : ''}`}>
                              {activo === 'general' && !mio && !agrupado && (
                                <p className="text-[11px] font-bold text-indigo-600 mb-0.5">{m.remitenteNombre}</p>
                              )}
                              <p className="text-sm whitespace-pre-wrap break-words">{m.contenido}</p>
                              <div className={`flex items-center justify-end gap-1 text-[10px] ${mio && !m.error ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {m.error ? <span>{m.error}</span> : <span>{hora(m.createdAt)}</span>}
                                {mio && !m.error && activo !== 'general' && (
                                  m.pendiente ? <Loader2 size={11} className="animate-spin" />
                                    : m.leido ? <CheckCheck size={13} className="text-sky-300" />
                                    : <Check size={13} />
                                )}
                                {mio && !m.error && activo === 'general' && m.pendiente && <Loader2 size={11} className="animate-spin" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={finRef} />
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); enviar(); }} className="p-3 border-t border-slate-100 flex items-end gap-2 bg-white">
                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={texto}
                      maxLength={2000}
                      onChange={(e) => { setTexto(e.target.value); avisarEscribiendo(e.target.value); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                      placeholder="Escribí un mensaje... (Enter para enviar)"
                      className="flex-1 resize-none max-h-32 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                    />
                    <button type="submit" disabled={!texto.trim()} className="h-10 w-10 shrink-0 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 transition" title="Enviar">
                      <Send size={17} />
                    </button>
                  </form>
                </>
              )}
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
