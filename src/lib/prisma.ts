import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    }).$extends({
        query: {
            $allOperations({ operation, model, args, query }) {
                const start = Date.now();
                const result = query(args);
                const end = Date.now();

                // Log slow queries (>1000ms)
                const duration = end - start;
                if (duration > 1000) {
                    console.warn(`⚠️  Slow query: ${model}.${operation} took ${duration}ms`);
                }

                return result;
            },
        },
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
