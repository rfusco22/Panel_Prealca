import { Server } from 'socket.io';

/**
 * Get the Socket.io server instance from globalThis.
 * This works because server.ts sets (globalThis as any).__socketio = io
 */
export function getIO(): Server | null {
  return (globalThis as any).__socketio || null;
}

/**
 * Emit an event to all connected clients
 */
export function emitSocketEvent(event: string, data?: any) {
  const io = getIO();
  if (io) {
    io.emit(event, data);
  }
}
