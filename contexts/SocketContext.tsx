'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// @ts-ignore
import { io as ioClient } from 'socket.io-client';

interface SocketContextType {
  socket: any;
  connected: boolean;
  onlineUserIds: number[];
  lastSeen: Record<number, number>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  onlineUserIds: [],
  lastSeen: {},
});

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
  const [lastSeen, setLastSeen] = useState<Record<number, number>>({});

  useEffect(() => {
    const newSocket = ioClient({
      path: '/api/socketio',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    const identifyUser = () => {
      fetch('/api/auth/session')
        .then(res => res.json())
        .then(data => {
          if (data?.user?.id) {
            newSocket.emit('user:identify', data.user.id);
          }
        })
        .catch(() => {});
    };

    newSocket.on('connect', () => {
      setConnected(true);
      identifyUser();
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('presence:update', (data: { onlineUserIds: number[], lastSeen: Record<number, number> }) => {
      setOnlineUserIds(data.onlineUserIds);
      setLastSeen(data.lastSeen);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, onlineUserIds, lastSeen }}>
      {children}
    </SocketContext.Provider>
  );
}
