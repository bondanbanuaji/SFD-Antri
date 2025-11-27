'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketConnectionOptions {
    room?: string;
    onConnect?: () => void;
    onDisconnect?: (reason: string) => void;
    onError?: (error: Error) => void;
}

export function useSocketConnection(options: UseSocketConnectionOptions = {}) {
    const { room, onConnect, onDisconnect, onError } = options;

    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const isInitialized = useRef(false);

    useEffect(() => {
        // Prevent double initialization in development strict mode
        if (isInitialized.current) return;
        isInitialized.current = true;

        console.log('🚀 [Socket] Initializing connection...');

        const newSocket = io({
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 20000,
        });

        newSocket.on('connect', () => {
            console.log('✅ [Socket] Connected:', newSocket.id);
            console.log('   - Transport:', newSocket.io.engine.transport.name);
            setIsConnected(true);

            if (room) {
                newSocket.emit('join', room);
                console.log(`📍 [Socket] Joined room: ${room}`);
            }

            onConnect?.();
        });

        newSocket.on('connect_error', (err) => {
            console.error('❌ [Socket] Connection Error:', err.message);
            setIsConnected(false);
            onError?.(err);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ [Socket] Disconnected:', reason);
            setIsConnected(false);
            onDisconnect?.(reason);
        });

        setSocket(newSocket);

        return () => {
            console.log('🔌 [Socket] Cleaning up connection');
            newSocket.disconnect();
            isInitialized.current = false;
        };
    }, []); // Empty deps - only mount once

    const on = useCallback((event: string, handler: (...args: any[]) => void) => {
        socket?.on(event, handler);
    }, [socket]);

    const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
        if (handler) {
            socket?.off(event, handler);
        } else {
            socket?.off(event);
        }
    }, [socket]);

    const emit = useCallback((event: string, ...args: any[]) => {
        socket?.emit(event, ...args);
    }, [socket]);

    return {
        socket,
        isConnected,
        on,
        off,
        emit,
    };
}
