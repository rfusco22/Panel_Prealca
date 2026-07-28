import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const connectedUsers = new Map<string, number>();
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
    socket.on('user:identify', (userId: number) => {
      connectedUsers.set(socket.id, userId);
      onlineUserIds.add(userId);
      io.emit('presence:update', { onlineUserIds: Array.from(onlineUserIds) });
    });

    socket.on('disconnect', () => {
      const userId = connectedUsers.get(socket.id);
      connectedUsers.delete(socket.id);
      if (userId && !Array.from(connectedUsers.values()).includes(userId)) {
        onlineUserIds.delete(userId);
      }
      io.emit('presence:update', { onlineUserIds: Array.from(onlineUserIds) });
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
