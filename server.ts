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

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    const parsedUrl = parse(req.url!, true);
    await handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    path: '/api/socketio',
  });

  (globalThis as any).__socketio = io;

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('user:identify', (userId: number) => {
      connectedSockets.set(socket.id, userId);
      onlineUserIds.add(userId);
      console.log(`[Socket] User ${userId} identified. Online: [${[...onlineUserIds].join(',')}]`);
      io.emit('presence:update', { onlineUserIds: [...onlineUserIds] });
    });

    socket.on('disconnect', (reason) => {
      const userId = connectedSockets.get(socket.id);
      connectedSockets.delete(socket.id);
      // Only remove if no other sockets for this user
      const stillConnected = [...connectedSockets.values()].includes(userId!);
      if (!stillConnected && userId) {
        onlineUserIds.delete(userId);
      }
      console.log(`[Socket] User ${userId} disconnected (${reason}). Online: [${[...onlineUserIds].join(',')}]`);
      io.emit('presence:update', { onlineUserIds: [...onlineUserIds] });
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
