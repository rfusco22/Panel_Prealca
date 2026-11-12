// Debe ir primero: carga el .env antes de que se evalúen los módulos de abajo
// (lib/session.ts lee process.env al importarse).
import './lib/load-env';

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { unsealData } from 'iron-session';
import { sessionOptions, SessionData, leerSessionSecret } from './lib/session';
import { verificarConfigDb } from './lib/db';
import { guardarMensaje, marcarDirectosLeidos, marcarGeneralLeido } from './lib/chat';

// Las validaciones viven acá, al arrancar, y no al importar cada módulo: el
// build de Next evalúa todas las rutas y no tiene por qué conocer las
// credenciales. Con esto se sigue fallando temprano y con un mensaje claro si
// falta una variable, pero en el contenedor y no en el build.
try {
  verificarConfigDb();
  leerSessionSecret();
} catch (err) {
  console.error('Configuración incompleta:', err instanceof Error ? err.message : err);
  process.exit(1);
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Orígenes permitidos para Socket.IO. Si no se define ALLOWED_ORIGINS solo se
// acepta el mismo origen de la app, que es el caso normal: el cliente se conecta
// con io() sin URL. Antes esto era origin: '*', o sea cualquier sitio web podía
// abrir un socket y escuchar todos los eventos de negocio.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const connectedSockets = new Map<string, number>();
const onlineUserIds = new Set<number>();
const lastSeenMap = new Map<number, number>();

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let appReady = false;

const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (!appReady) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'starting' }));
    return;
  }
  try {
    const parsedUrl = parse(req.url!, true);
    await handle(req, res, parsedUrl);
  } catch (err) {
    console.error('Request error:', err);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

const io = new Server(httpServer, {
  cors: allowedOrigins.length > 0
    ? { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true }
    : { origin: false },
  path: '/api/socketio',
});

// lib/socket-server.ts lo lee desde acá para emitir eventos desde las rutas API.
(globalThis as any).__socketio = io;

function leerCookie(header: string | undefined, nombre: string): string | null {
  if (!header) return null;
  for (const parte of header.split(';')) {
    const sep = parte.indexOf('=');
    if (sep === -1) continue;
    if (parte.slice(0, sep).trim() === nombre) {
      return decodeURIComponent(parte.slice(sep + 1).trim());
    }
  }
  return null;
}

// Autenticación del socket: se valida la cookie de sesión en el handshake y la
// identidad sale de ahí, no de lo que diga el cliente. Antes cualquiera podía
// conectarse sin sesión y emitir user:identify con el id de otro usuario.
io.use(async (socket, siguiente) => {
  try {
    const sellada = leerCookie(socket.handshake.headers.cookie, sessionOptions.cookieName);
    if (!sellada) return siguiente(new Error('No autorizado'));

    const datos = await unsealData<SessionData>(sellada, {
      password: sessionOptions.password as string,
    });

    if (!datos?.userId) return siguiente(new Error('No autorizado'));

    socket.data.userId = Number(datos.userId);
    socket.data.role = datos.role;
    return siguiente();
  } catch {
    return siguiente(new Error('No autorizado'));
  }
});

function emitirPresencia() {
  io.emit('presence:update', {
    onlineUserIds: [...onlineUserIds],
    lastSeen: Object.fromEntries(lastSeenMap),
  });
}

io.on('connection', (socket) => {
  const userId: number = socket.data.userId;

  connectedSockets.set(socket.id, userId);
  onlineUserIds.add(userId);
  lastSeenMap.delete(userId);
  emitirPresencia();

  // ── Chat ──
  // Cada usuario tiene su sala: así un mensaje directo llega a todas sus
  // pestañas abiertas y a nadie más. El remitente sale siempre de la sesión
  // (socket.data.userId), nunca de lo que mande el cliente.
  socket.join(`user:${userId}`);

  // Límite simple contra spam: hasta 20 mensajes cada 10 segundos por socket.
  let ventanaInicio = Date.now();
  let enviadosEnVentana = 0;

  socket.on('chat:send', async (payload: any, ack?: (r: any) => void) => {
    const responder = typeof ack === 'function' ? ack : () => {};
    try {
      const ahora = Date.now();
      if (ahora - ventanaInicio > 10_000) { ventanaInicio = ahora; enviadosEnVentana = 0; }
      if (++enviadosEnVentana > 20) return responder({ ok: false, error: 'Estás enviando mensajes muy rápido.' });

      const to = payload?.to === null || payload?.to === undefined || payload?.to === 'general'
        ? null
        : Number(payload.to);
      const r = await guardarMensaje(userId, to, payload?.contenido);
      if ('error' in r) return responder({ ok: false, error: r.error });

      const mensaje = { ...r.mensaje, tempId: payload?.tempId ?? null };
      if (to === null) io.emit('chat:message', mensaje);
      else io.to(`user:${to}`).to(`user:${userId}`).emit('chat:message', mensaje);
      responder({ ok: true, mensaje });
    } catch (err) {
      console.error('chat:send error:', err);
      responder({ ok: false, error: 'No se pudo enviar el mensaje.' });
    }
  });

  socket.on('chat:typing', (payload: any) => {
    const typing = !!payload?.typing;
    const to = payload?.to === null || payload?.to === undefined || payload?.to === 'general' ? null : Number(payload.to);
    if (to === null) socket.broadcast.emit('chat:typing', { from: userId, to: null, typing });
    else if (Number.isInteger(to) && to > 0) io.to(`user:${to}`).emit('chat:typing', { from: userId, to, typing });
  });

  socket.on('chat:read', async (payload: any) => {
    try {
      const con = payload?.con === null || payload?.con === undefined || payload?.con === 'general' ? null : Number(payload.con);
      if (con === null) {
        await marcarGeneralLeido(userId);
      } else if (Number.isInteger(con) && con > 0) {
        const n = await marcarDirectosLeidos(userId, con);
        // Confirmación de lectura para el que los envió (los ✓✓).
        if (n > 0) io.to(`user:${con}`).emit('chat:read', { by: userId });
      }
      // Las otras pestañas del mismo usuario actualizan su contador.
      io.to(`user:${userId}`).emit('chat:unread-changed', { con });
    } catch (err) {
      console.error('chat:read error:', err);
    }
  });

  socket.on('disconnect', () => {
    connectedSockets.delete(socket.id);
    const sigueConectado = [...connectedSockets.values()].includes(userId);
    if (!sigueConectado) {
      onlineUserIds.delete(userId);
      lastSeenMap.set(userId, Date.now());
    }
    emitirPresencia();
  });
});

httpServer.listen(port, hostname, () => {
  console.log(`> Ready on http://${hostname}:${port}`);
});

app.prepare().then(() => {
  appReady = true;
  console.log('> Next.js app prepared');
}).catch((err) => {
  console.error('Next.js prepare error:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
