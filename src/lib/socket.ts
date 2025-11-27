import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/lib/prisma';

// Declare global type for io to avoid TypeScript errors
declare global {
    var io: SocketIOServer | undefined;
}

interface ConnectedUser {
    socketId: string;
    userId?: string;
    role?: string;
    loketId?: number;
    connectedAt: Date;
}

const connectedUsers = new Map<string, ConnectedUser>();

export function initSocketServer(httpServer: HTTPServer) {
    if (globalThis.io) return globalThis.io;

    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    io.on('connection', (socket: Socket) => {
        console.log('✅ Client connected:', socket.id);

        connectedUsers.set(socket.id, {
            socketId: socket.id,
            connectedAt: new Date(),
        });

        // Broadcast user count
        broadcastOnlineCount();

        // Join room based on client type
        socket.on('join', (room: unknown, userData?: unknown) => {
            // Validate room parameter
            if (typeof room !== 'string' || room.length === 0 || room.length > 50) {
                console.error('❌ Invalid room name:', room);
                socket.emit('error', { message: 'Nama room tidak valid' });
                return;
            }

            socket.join(room);
            console.log(`📍 Client ${socket.id} joined room: ${room}`);
            console.log(`   - Current rooms for ${socket.id}:`, Array.from(socket.rooms));

            if (userData) {
                const user = connectedUsers.get(socket.id);
                if (user) {
                    connectedUsers.set(socket.id, { ...user, ...(userData as any) });
                }
            }

            // Send current room users
            const roomUsers = getRoomUsers(room);
            console.log(`   - Room ${room} now has ${roomUsers.length} users`);
            if (globalThis.io) {
                globalThis.io.to(room).emit('room:users', roomUsers);
            }
        });

        // Leave room
        socket.on('leave', (room: unknown) => {
            if (typeof room !== 'string') {
                console.error('❌ Invalid room name:', room);
                return;
            }

            socket.leave(room);
            console.log(`📍 Client ${socket.id} left room: ${room}`);
            if (globalThis.io) {
                globalThis.io.to(room).emit('room:users', getRoomUsers(room));
            }
        });

        // Handle user identification
        socket.on('user:identify', (userData: unknown) => {
            // Basic validation
            if (!userData || typeof userData !== 'object') {
                console.error('❌ Invalid user data:', userData);
                socket.emit('error', { message: 'Data user tidak valid' });
                return;
            }

            const user = connectedUsers.get(socket.id);
            if (user) {
                connectedUsers.set(socket.id, { ...user, ...(userData as any) });
                broadcastOnlineCount();
            }
        });

        // Handle queue recall from loket
        socket.on('queue:recall', (data: unknown) => {
            console.log('🔁 Queue recall received (raw):', data);

            // Validate incoming data
            const { QueueRecallSchema } = require('@/lib/socket-validation');
            const validationResult = QueueRecallSchema.safeParse(data);

            if (!validationResult.success) {
                console.error('❌ Invalid queue:recall data:', validationResult.error);
                socket.emit('error', {
                    message: 'Data tidak valid',
                    details: validationResult.error.errors
                });
                return;
            }

            const queue = validationResult.data;
            console.log('✅ Validated queue recall:', queue.code);
            console.log('   - Queue data:', JSON.stringify(queue, null, 2));

            // Ensure data has all required fields
            const recallData = {
                id: queue.id,
                code: queue.code,
                type: queue.type,
                status: 'CALLED',
                loketId: queue.loketId,
                loket: queue.loket || null,
            };

            console.log('   - Emitting queue:recall to display (NOT queue:called)');
            if (globalThis.io) {
                // Emit as queue:recall so display can differentiate from first call
                globalThis.io.to('display').emit('queue:recall', recallData);
                console.log('   ✓ queue:recall emitted to display');
            }
        });

        // Debug/Test handlers
        socket.on('test:ping', (data: any) => {
            console.log('🧪 Test ping received from', socket.id, ':', data);
            socket.emit('test:response', {
                message: 'Pong!',
                receivedData: data,
                timestamp: new Date().toISOString()
            });
        });

        socket.on('test:simulate-queue-called', (queue: any) => {
            console.log('🧪 Simulating queue:called event:', queue);
            // Emit to display room
            if (globalThis.io) {
                globalThis.io.to('display').emit('queue:called', queue);
                console.log('   ✓ Simulated queue:called emitted to display room');
            }
        });

        // Ping/Pong for connection health
        socket.on('ping', () => {
            socket.emit('pong');
        });

        socket.on('disconnect', () => {
            console.log('❌ Client disconnected:', socket.id);
            connectedUsers.delete(socket.id);
            broadcastOnlineCount();
        });
    });

    globalThis.io = io;
    return io;
}

export function getIO(): SocketIOServer {
    if (!globalThis.io) {
        throw new Error('Socket.io not initialized!');
    }
    return globalThis.io;
}

function getRoomUsers(room: string): ConnectedUser[] {
    const users: ConnectedUser[] = [];
    const roomSockets = globalThis.io?.sockets.adapter.rooms.get(room);

    if (roomSockets) {
        roomSockets.forEach((socketId) => {
            const user = connectedUsers.get(socketId);
            if (user) {
                users.push(user);
            }
        });
    }

    return users;
}

function broadcastOnlineCount() {
    if (globalThis.io) {
        const count = connectedUsers.size;
        globalThis.io.emit('users:online', count);
    }
}

// Enhanced emit functions
export function emitQueueUpdate(event: string, data: any) {
    if (globalThis.io) {
        // Validate and log data being emitted
        const eventData = {
            id: data.id,
            code: data.code,
            type: data.type,
            status: data.status,
            loketId: data.loketId,
            loket: data.loket || null,
            calledAt: data.calledAt,
            finishedAt: data.finishedAt,
            transportCode: data.transportCode,
            passengerName: data.passengerName,
            passengerRoute: data.passengerRoute,
        };

        console.log(`\n🚀 [SOCKET] ===== EMITTING ${event.toUpperCase()} =====`);
        console.log('   📋 Full Event Data:', JSON.stringify(eventData, null, 2));
        console.log('   🔢 Code:', eventData.code);
        console.log('   🏢 Loket ID:', eventData.loketId);
        console.log('   🏢 Loket Object:', eventData.loket);
        console.log('   📊 Status:', eventData.status);

        // CRITICAL VALIDATION
        if (!eventData.loketId && (event === 'queue:called' || event === 'queue:completed' || event === 'queue:skipped')) {
            console.error('   ❌ CRITICAL ERROR: Emitting', event, 'WITHOUT loketId!');
            console.error('   ❌ Display will NOT be able to update the correct slot!');
            console.error('   ❌ Original data:', data);
        }

        // Emit to specific rooms only (avoid duplicate broadcasts)
        const rooms = ['display', 'loket', 'kiosk', 'admin'];
        console.log('   📡 Broadcasting to rooms:', rooms.join(', '));

        rooms.forEach(room => {
            if (globalThis.io) {
                globalThis.io.to(room).emit(event, eventData);
                console.log(`   ✅ Sent to room: ${room}`);
            }
        });

        console.log('   🎉 [SOCKET] Emit completed successfully\n');
    } else {
        console.error('❌ [SOCKET] Socket.io NOT initialized, cannot emit event:', event);
    }
}

export function emitToLoket(loketId: number, event: string, data: any) {
    if (globalThis.io) {
        console.log(`📢 Emitting ${event} to loket-${loketId}`);
        globalThis.io.to(`loket-${loketId}`).emit(event, data);
    }
}

export function emitToAll(event: string, data: any) {
    if (globalThis.io) {
        console.log(`📢 Broadcasting ${event} to all clients`);
        globalThis.io.emit(event, data);
    }
}

export function emitToRoom(room: string, event: string, data: any) {
    if (globalThis.io) {
        console.log(`📢 Emitting ${event} to room ${room}`);
        globalThis.io.to(room).emit(event, data);
    }
}

export function getConnectedUsers(): ConnectedUser[] {
    return Array.from(connectedUsers.values());
}

export function getOnlineCount(): number {
    return connectedUsers.size;
}
