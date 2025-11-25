import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/lib/prisma';

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HTTPServer) {
    if (io) return io;

    io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket: Socket) => {
        console.log('Client connected:', socket.id);

        // Join room based on client type
        socket.on('join', (room: string) => {
            socket.join(room);
            console.log(`Client ${socket.id} joined room: ${room}`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
}

export function getIO(): SocketIOServer {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
}

// Emit events to specific rooms
export function emitQueueUpdate(event: string, data: any) {
    if (io) {
        io.to('display').emit(event, data);
        io.to('loket').emit(event, data);
    }
}

export function emitToLoket(loketId: number, event: string, data: any) {
    if (io) {
        io.to(`loket-${loketId}`).emit(event, data);
    }
}
