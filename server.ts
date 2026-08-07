import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const connectedSockets = new Map<string, number>();
const onlineUserIds = new Set<number>();
const lastSeenMap = new Map<number, number>();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    if (req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }
    const parsedUrl = parse(req.url!, true);
    await handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    path: '/api/socketio',
  });

  (globalThis as any).__socketio = io;

  io.on('connection', (socket) => {
    socket.on('user:identify', (userId: number) => {
      connectedSockets.set(socket.id, userId);
      onlineUserIds.add(userId);
      lastSeenMap.delete(userId);
      io.emit('presence:update', {
        onlineUserIds: [...onlineUserIds],
        lastSeen: Object.fromEntries(lastSeenMap),
      });
    });

    socket.on('disconnect', () => {
      const userId = connectedSockets.get(socket.id);
      connectedSockets.delete(socket.id);
      const stillConnected = [...connectedSockets.values()].includes(userId!);
      if (!stillConnected && userId) {
        onlineUserIds.delete(userId);
        lastSeenMap.set(userId, Date.now());
      }
      io.emit('presence:update', {
        onlineUserIds: [...onlineUserIds],
        lastSeen: Object.fromEntries(lastSeenMap),
      });
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
