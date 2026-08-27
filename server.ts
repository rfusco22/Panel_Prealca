// Debe ir primero: carga el .env antes de que se evalúen los módulos de abajo
// (lib/session.ts lee process.env al importarse).
import './lib/load-env';

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { unsealData } from 'iron-session';
import { sessionOptions, SessionData } from './lib/session';

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
