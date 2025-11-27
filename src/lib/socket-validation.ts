import { z } from 'zod';

// Socket Event Validation Schemas

export const QueueRecallSchema = z.object({
    id: z.number().int().positive(),
    code: z.string().min(1).max(10),
    type: z.enum(['UMUM', 'BARANG']),
    loketId: z.number().int().positive(),
    loket: z.object({
        id: z.number(),
        name: z.string(),
        status: z.string().optional(),
    }).optional().nullable(),
    transportCode: z.string().max(20).optional().nullable(),
    passengerName: z.string().max(100).optional().nullable(),
    passengerRoute: z.string().max(150).optional().nullable(),
});

export const JoinRoomSchema = z.object({
    room: z.string().min(1).max(50),
    userData: z.object({
        userId: z.string().optional(),
        role: z.string().optional(),
        loketId: z.number().optional(),
    }).optional(),
});

export const UserIdentifySchema = z.object({
    userId: z.string().optional(),
    role: z.enum(['ADMIN', 'PETUGAS']).optional(),
    loketId: z.number().int().positive().optional(),
});

// Type exports
export type QueueRecallInput = z.infer<typeof QueueRecallSchema>;
export type JoinRoomInput = z.infer<typeof JoinRoomSchema>;
export type UserIdentifyInput = z.infer<typeof UserIdentifySchema>;
