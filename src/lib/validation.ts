import { z } from 'zod';

// Service Type Validation
export const ServiceTypeSchema = z.enum(['UMUM', 'BARANG']);

// Queue Status Validation
export const QueueStatusSchema = z.enum(['WAITING', 'CALLED', 'COMPLETED', 'SKIPPED']);

// Create Queue Schema
export const CreateQueueSchema = z.object({
    type: ServiceTypeSchema,
    transportCode: z.string().max(20, 'Kode transport maksimal 20 karakter').optional(),
    passengerName: z.string().max(100, 'Nama penumpang maksimal 100 karakter').optional(),
    passengerRoute: z.string().max(150, 'Rute perjalanan maksimal 150 karakter').optional(),
});

// Update Queue Schema
export const UpdateQueueSchema = z.object({
    action: z.enum(['call', 'complete', 'skip']),
    loketId: z.number().int().positive().optional(),
});

// Password Schema with strength requirements
export const PasswordSchema = z.string()
    .min(8, 'Password minimal 8 karakter')
    .max(128, 'Password maksimal 128 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
    .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
    .regex(/[0-9]/, 'Password harus mengandung angka')
    .regex(/[^A-Za-z0-9]/, 'Password harus mengandung karakter spesial');

// Login Schema
export const LoginSchema = z.object({
    username: z.string().min(3, 'Username minimal 3 karakter').max(50, 'Username maksimal 50 karakter'),
    password: z.string().min(6, 'Password minimal 6 karakter').max(128, 'Password maksimal 128 karakter'),
});

// Create User Schema (for registration with strong password)
export const CreateUserSchema = z.object({
    username: z.string().min(3, 'Username minimal 3 karakter').max(50, 'Username maksimal 50 karakter'),
    password: PasswordSchema,
    name: z.string().min(3, 'Nama minimal 3 karakter').max(100, 'Nama maksimal 100 karakter'),
    role: z.enum(['ADMIN', 'PETUGAS']).optional(),
});

// Stats Query Schema
export const StatsQuerySchema = z.object({
    startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

// Type exports
export type CreateQueueInput = z.infer<typeof CreateQueueSchema>;
export type UpdateQueueInput = z.infer<typeof UpdateQueueSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type StatsQueryInput = z.infer<typeof StatsQuerySchema>;
