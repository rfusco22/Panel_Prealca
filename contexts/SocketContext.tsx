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
    let socketActual: any = null;
    let reintento: ReturnType<typeof setTimeout> | null = null;
    let desmontado = false;

    const conectar = () => {
      if (desmontado) return;

      const newSocket = ioClient({
        path: '/api/socketio',
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        withCredentials: true,
      });
      socketActual = newSocket;

      // Ya no hace falta anunciar quién es: el servidor saca la identidad de la
      // cookie de sesión durante el handshake.
      newSocket.on('connect', () => setConnected(true));
      newSocket.on('disconnect', () => setConnected(false));

      // Sin sesión el servidor rechaza el handshake. Este provider envuelve
      // también la pantalla de login, así que hay que cortar el reintento
      // automático: si no, quedaría pidiendo una vez por segundo para siempre.
      // Se vuelve a probar cada 15s, y así engancha solo al iniciar sesión.
      newSocket.on('connect_error', () => {
        setConnected(false);
        newSocket.close();
        if (!desmontado && !reintento) {
          reintento = setTimeout(() => {
            reintento = null;
            conectar();
          }, 15000);
        }
      });

      newSocket.on('presence:update', (data: { onlineUserIds: number[], lastSeen: Record<number, number> }) => {
        setOnlineUserIds(data.onlineUserIds);
        setLastSeen(data.lastSeen);
      });

      setSocket(newSocket);
    };

    conectar();

    return () => {
      desmontado = true;
      if (reintento) clearTimeout(reintento);
      if (socketActual) socketActual.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, onlineUserIds, lastSeen }}>
      {children}
    </SocketContext.Provider>
  );
}
