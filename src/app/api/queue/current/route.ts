import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable ISR caching


/**
 * GET /api/queue/current
 * Get all currently called queues (status: CALLED)
 */
export async function GET() {
    try {
        const calledQueues = await prisma.queue.findMany({
            where: {
                status: 'CALLED',
            },
            include: {
                loket: true,
            },
            orderBy: {
                calledAt: 'desc',
            },
        });

        return apiSuccess(calledQueues);
    } catch (error) {
        return handleApiError(error);
    }
}
