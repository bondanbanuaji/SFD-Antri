import { ServiceType, Queue } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function generateQueueNumber(
    type: ServiceType,
    transportCode?: string,
    passengerName?: string,
    passengerRoute?: string,
    loketId?: number
): Promise<Queue> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the last queue number for today
    const lastQueue = await prisma.queue.findFirst({
        where: {
            type,
            createdAt: {
                gte: today,
            },
        },
        orderBy: {
            number: 'desc',
        },
    });

    const nextNumber = lastQueue ? lastQueue.number + 1 : 1;
    const prefix = type === 'UMUM' ? 'U' : 'B';
    const code = `${prefix}-${String(nextNumber).padStart(3, '0')}`;

    const queue = await prisma.queue.create({
        data: {
            number: nextNumber,
            code,
            type,
            status: 'WAITING',
            transportCode,
            passengerName,
            passengerRoute,
            loketId,
        },
    });

    return queue;
}

export async function getNextQueueInLine(type?: ServiceType) {
    const whereClause: any = {
        status: 'WAITING',
    };

    if (type) {
        whereClause.type = type;
    }

    return await prisma.queue.findFirst({
        where: whereClause,
        orderBy: {
            createdAt: 'asc',
        },
    });
}

export async function callQueue(queueId: number, loketId: number) {
    return await prisma.queue.update({
        where: { id: queueId },
        data: {
            status: 'CALLED',
            calledAt: new Date(),
            loketId,
        },
        include: {
            loket: true,
        },
    });
}

export async function completeQueue(queueId: number) {
    return await prisma.queue.update({
        where: { id: queueId },
        data: {
            status: 'COMPLETED',
            finishedAt: new Date(),
        },
        include: {
            loket: true,
        },
    });
}

export async function skipQueue(queueId: number) {
    return await prisma.queue.update({
        where: { id: queueId },
        data: {
            status: 'SKIPPED',
            finishedAt: new Date(),
        },
        include: {
            loket: true,
        },
    });
}

export async function getWaitingQueues(type?: ServiceType) {
    const whereClause: any = {
        status: 'WAITING',
    };

    if (type) {
        whereClause.type = type;
    }

    return await prisma.queue.findMany({
        where: whereClause,
        orderBy: {
            createdAt: 'asc',
        },
    });
}

export async function getQueueStats(startDate: Date, endDate: Date) {
    const queues = await prisma.queue.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
        include: {
            loket: true,
        },
    });

    const stats = {
        total: queues.length,
        byType: {
            UMUM: queues.filter((q) => q.type === 'UMUM').length,
            BARANG: queues.filter((q) => q.type === 'BARANG').length,
        },
        byStatus: {
            COMPLETED: queues.filter((q) => q.status === 'COMPLETED').length,
            SKIPPED: queues.filter((q) => q.status === 'SKIPPED').length,
            WAITING: queues.filter((q) => q.status === 'WAITING').length,
            CALLED: queues.filter((q) => q.status === 'CALLED').length,
        },
        byLoket: {} as Record<number, number>,
        averageWaitTime: 0,
    };

    // Calculate stats by loket
    queues.forEach((q) => {
        if (q.loketId) {
            stats.byLoket[q.loketId] = (stats.byLoket[q.loketId] || 0) + 1;
        }
    });

    // Calculate average wait time (completed queues only)
    const completedQueues = queues.filter(
        (q) => q.status === 'COMPLETED' && q.calledAt
    );
    if (completedQueues.length > 0) {
        const totalWaitTime = completedQueues.reduce((sum, q) => {
            const waitTime = q.calledAt!.getTime() - q.createdAt.getTime();
            return sum + waitTime;
        }, 0);
        stats.averageWaitTime = Math.round(totalWaitTime / completedQueues.length / 1000); // in seconds
    }

    return stats;
}
