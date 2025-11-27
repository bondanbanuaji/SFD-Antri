import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth-middleware';
import { apiSuccess, handleApiError } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

/**
 * GET /api/stats/realtime
 * Get real-time statistics for admin dashboard
 */
export async function GET(request: NextRequest) {
    try {
        // Require ADMIN role
        const { user, error } = await requireRole(request, ['ADMIN']);
        if (error) return error;

        const today = new Date();
        const todayStart = startOfDay(today);
        const todayEnd = endOfDay(today);

        // Get today's statistics
        const [
            totalToday,
            waitingToday,
            calledToday,
            completedToday,
            skippedToday,
            umumToday,
            barangToday,
            lokets,
            recentQueues,
        ] = await Promise.all([
            // Total queues today
            prisma.queue.count({
                where: {
                    createdAt: {
                        gte: todayStart,
                        lte: todayEnd,
                    },
                },
            }),

            // Waiting queues
            prisma.queue.count({
                where: {
                    status: 'WAITING',
                    createdAt: {
                        gte: todayStart,
                        lte: todayEnd,
                    },
                },
            }),

            // Called queues
            prisma.queue.count({
                where: {
                    status: 'CALLED',
                    createdAt: {
                        gte: todayStart,
                        lte: todayEnd,
                    },
                },
            }),

            // Completed queues
            prisma.queue.count({
                where: {
                    status: 'COMPLETED',
                    createdAt: {
                        gte: todayStart,
                        lte: todayEnd,
                    },
                },
            }),

            // Skipped queues
            prisma.queue.count({
                where: {
                    status: 'SKIPPED',
                    createdAt: {
                        gte: todayStart,
                        lte: todayEnd,
                    },
                },
            }),

            // Angkutan Umum
            prisma.queue.count({
                where: {
                    type: 'UMUM',
                    createdAt: {
                        gte: todayStart,
                        lte: todayEnd,
                    },
                },
            }),

            // Angkutan Barang
            prisma.queue.count({
                where: {
                    type: 'BARANG',
                    createdAt: {
                        gte: todayStart,
                        lte: todayEnd,
                    },
                },
            }),

            // Lokets with current queue and stats
            prisma.loket.findMany({
                include: {
                    queues: {
                        where: {
                            status: 'CALLED',
                        },
                        orderBy: {
                            calledAt: 'desc',
                        },
                        take: 1,
                    },
                    _count: {
                        select: {
                            queues: {
                                where: {
                                    createdAt: {
                                        gte: todayStart,
                                        lte: todayEnd,
                                    },
                                    status: 'COMPLETED',
                                },
                            },
                        },
                    },
                },
            }),

            // Recent queues (last 10)
            prisma.queue.findMany({
                take: 10,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    loket: true,
                },
            }),
        ]);

        // Calculate average wait time (for completed queues)
        const completedQueuesWithTimes = await prisma.queue.findMany({
            where: {
                status: 'COMPLETED',
                createdAt: {
                    gte: todayStart,
                    lte: todayEnd,
                },
                calledAt: { not: null },
            },
            select: {
                createdAt: true,
                calledAt: true,
            },
        });

        const avgWaitTime =
            completedQueuesWithTimes.length > 0
                ? completedQueuesWithTimes.reduce((sum, queue) => {
                    const waitMs = queue.calledAt!.getTime() - queue.createdAt.getTime();
                    return sum + waitMs / 1000 / 60; // Convert to minutes
                }, 0) / completedQueuesWithTimes.length
                : 0;

        return apiSuccess({
            summary: {
                totalToday,
                waitingToday,
                calledToday,
                completedToday,
                skippedToday,
                umumToday,
                barangToday,
                avgWaitTime: Math.round(avgWaitTime),
            },
            lokets: lokets.map((loket) => ({
                id: loket.id,
                name: loket.name,
                status: loket.status,
                currentQueue: loket.queues[0] || null,
                completedToday: loket._count.queues,
            })),
            recentQueues,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return handleApiError(error);
    }
}
