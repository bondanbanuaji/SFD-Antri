import { NextRequest } from 'next/server';
import { generateQueueNumber } from '@/lib/queue';
import { emitQueueUpdate } from '@/lib/socket';
import { CreateQueueSchema } from '@/lib/validation';
import { apiSuccess, apiError, validateRequest, handleApiError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
    try {
        // Validate request
        const { data, error } = await validateRequest(request, CreateQueueSchema);
        if (error) return error;

        const { prisma } = await import('@/lib/prisma');

        // --- SMART QUEUEING (LOAD BALANCING) ---

        // 1. Get all OPEN lokets
        const openLokets = await prisma.loket.findMany({
            where: { status: 'OPEN' },
            select: { id: true }
        });

        let assignedLoketId: number | undefined;

        if (openLokets.length > 0) {
            // 2. Count WAITING queues for each open loket
            const queueCounts = await prisma.queue.groupBy({
                by: ['loketId'],
                where: {
                    status: 'WAITING',
                    loketId: { in: openLokets.map(l => l.id) }
                },
                _count: {
                    loketId: true
                }
            });

            // Map counts for easy lookup
            const countMap = new Map<number, number>();
            queueCounts.forEach(c => {
                if (c.loketId) countMap.set(c.loketId, c._count.loketId);
            });

            // 3. Create array with ALL lokets and their counts (including 0)
            const allLoketCounts = openLokets.map(loket => ({
                id: loket.id,
                count: countMap.get(loket.id) || 0
            }));

            // 4. Find loket with MINIMUM queues
            const bestLoket = allLoketCounts.reduce((best, current) =>
                current.count < best.count ? current : best
            );

            assignedLoketId = bestLoket.id;
            console.log(`⚖️ [SMART QUEUE] Assigning to Loket ${assignedLoketId} (Queue Length: ${bestLoket.count})`);
        } else {
            console.log('⚠️ [SMART QUEUE] No open lokets found. Queue unassigned.');
        }

        // Generate queue with assigned loket
        const queue = await generateQueueNumber(
            (data as any).type,
            (data as any).transportCode,
            (data as any).passengerName,
            (data as any).passengerRoute,
            assignedLoketId
        );

        // Emit real-time update
        emitQueueUpdate('queue:new', queue);

        return apiSuccess(queue, { requestId: crypto.randomUUID() });
    } catch (error) {
        return handleApiError(error);
    }
}

export async function GET() {
    try {
        const { prisma } = await import('@/lib/prisma');

        const queues = await prisma.queue.findMany({
            where: {
                status: 'WAITING',
            },
            orderBy: {
                createdAt: 'asc',
            },
            take: 10,
        });

        return apiSuccess(queues);
    } catch (error) {
        return handleApiError(error);
    }
}
