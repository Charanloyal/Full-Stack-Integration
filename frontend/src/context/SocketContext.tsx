import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext.tsx';

interface SocketContextProps {
  socket: Socket | null;
  onlineUsers: any[];
}

const SocketContext = createContext<SocketContextProps | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setOnlineUsers([]);
      return;
    }

    const socketUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:5000'
      : window.location.origin;

    const newSocket = io(socketUrl, {
      auth: { token },
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSockets server!');
    });

    newSocket.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
