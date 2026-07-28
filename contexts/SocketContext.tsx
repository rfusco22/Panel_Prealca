'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// @ts-ignore
import { io as ioClient } from 'socket.io-client';

interface SocketContextType {
  socket: any;
  connected: boolean;
  onlineUserIds: number[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  onlineUserIds: [],
});

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);

  useEffect(() => {
    const socketUrl = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:3000`
      : 'http://localhost:3000';

    const newSocket = ioClient(socketUrl, {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      // Send userId to server for presence tracking
      fetch('/api/auth/session')
        .then(res => res.json())
        .then(data => {
          if (data?.user?.id) {
            newSocket.emit('user:identify', data.user.id);
          }
        })
        .catch(() => {});
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('presence:update', (data: { onlineUserIds: number[] }) => {
      setOnlineUserIds(data.onlineUserIds);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, onlineUserIds }}>
      {children}
    </SocketContext.Provider>
  );
}
