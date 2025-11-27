'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  autoConnect?: boolean;
  room?: string;
  userData?: any;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true, room, userData } = options;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!autoConnect) return;

    const newSocket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'], // Prefer websocket to avoid xhr poll errors
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      console.log('   - Transport:', newSocket.io.engine.transport.name);
      setIsConnected(true);

      if (room) {
        console.log(`   - Joining room: ${room}`);
        newSocket.emit('join', room, userData);
        
        // Confirm room join
        setTimeout(() => {
          console.log(`   - Verifying room join for: ${room}`);
        }, 500);
      }

      if (userData) {
        console.log('   - Identifying user:', userData);
        newSocket.emit('user:identify', userData);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('users:online', (count: number) => {
      setOnlineCount(count);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('room:users', (users: any[]) => {
      console.log(`📍 Room users update received:`, users.length, 'users');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [autoConnect, room, userData]);

  const emit = useCallback(
    (event: string, data?: any) => {
      if (socket) {
        socket.emit(event, data);
      }
    },
    [socket]
  );

  const on = useCallback(
    (event: string, handler: (...args: any[]) => void) => {
      if (socket) {
        socket.on(event, handler);
        return () => {
          socket.off(event, handler);
        };
      }
    },
    [socket]
  );

  const joinRoom = useCallback(
    (roomName: string, data?: any) => {
      if (socket) {
        socket.emit('join', roomName, data);
      }
    },
    [socket]
  );

  const leaveRoom = useCallback(
    (roomName: string) => {
      if (socket) {
        socket.emit('leave', roomName);
      }
    },
    [socket]
  );

  return {
    socket,
    isConnected,
    onlineCount,
    emit,
    on,
    joinRoom,
    leaveRoom,
  };
}
