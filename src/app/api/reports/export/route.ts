import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/export
 * Get report data for export (PDF/Excel)
 * Query params:
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - format: 'data' (returns JSON for client-side processing)
 */
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        if (!startDateStr || !endDateStr) {
            return NextResponse.json(
                { error: 'startDate and endDate are required' },
                { status: 400 }
            );
        }

        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        endDate.setHours(23, 59, 59, 999); // End of day

        // Fetch all queues in date range
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
            orderBy: {
                createdAt: 'asc',
            },
        });

        // Calculate statistics
        const totalQueues = queues.length;
        const umumQueues = queues.filter((q) => q.type === 'UMUM').length;
        const barangQueues = queues.filter((q) => q.type === 'BARANG').length;
        const completedQueues = queues.filter((q) => q.status === 'COMPLETED').length;
        const skippedQueues = queues.filter((q) => q.status === 'SKIPPED').length;
        const waitingQueues = queues.filter((q) => q.status === 'WAITING').length;
        const calledQueues = queues.filter((q) => q.status === 'CALLED').length;

        // Calculate average wait time (in minutes)
        const completedWithTime = queues.filter(
            (q) => q.status === 'COMPLETED' && q.calledAt
        );
        let avgWaitTime = 0;
        if (completedWithTime.length > 0) {
            const totalWaitTime = completedWithTime.reduce((sum, q) => {
                const waitTime = q.calledAt!.getTime() - q.createdAt.getTime();
                return sum + waitTime;
            }, 0);
            avgWaitTime = Math.round(totalWaitTime / completedWithTime.length / 1000 / 60);
        }

        // Calculate average service time (in minutes)
        const completedWithServiceTime = queues.filter(
            (q) => q.status === 'COMPLETED' && q.calledAt && q.finishedAt
        );
        let avgServiceTime = 0;
        if (completedWithServiceTime.length > 0) {
            const totalServiceTime = completedWithServiceTime.reduce((sum, q) => {
                const serviceTime = q.finishedAt!.getTime() - q.calledAt!.getTime();
                return sum + serviceTime;
            }, 0);
            avgServiceTime = Math.round(
                totalServiceTime / completedWithServiceTime.length / 1000 / 60
            );
        }

        // Group by loket
        const byLoket: Record<
            number,
            { loketName: string; total: number; completed: number; skipped: number }
        > = {};

        queues.forEach((q) => {
            if (q.loketId) {
                if (!byLoket[q.loketId]) {
                    byLoket[q.loketId] = {
                        loketName: q.loket?.name || `Loket ${q.loketId}`,
                        total: 0,
                        completed: 0,
                        skipped: 0,
                    };
                }
                byLoket[q.loketId].total++;
                if (q.status === 'COMPLETED') byLoket[q.loketId].completed++;
                if (q.status === 'SKIPPED') byLoket[q.loketId].skipped++;
            }
        });

        // Group by hour (for chart)
        const byHour: Record<number, number> = {};
        queues.forEach((q) => {
            const hour = new Date(q.createdAt).getHours();
            byHour[hour] = (byHour[hour] || 0) + 1;
        });

        // Convert to array for easier charting
        const hourlyData = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            count: byHour[i] || 0,
        }));

        return NextResponse.json({
            success: true,
            data: {
                period: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                },
                summary: {
                    totalQueues,
                    umumQueues,
                    barangQueues,
                    completedQueues,
                    skippedQueues,
                    waitingQueues,
                    calledQueues,
                    avgWaitTime,
                    avgServiceTime,
                    completionRate:
                        totalQueues > 0
                            ? Math.round((completedQueues / totalQueues) * 100)
                            : 0,
                },
                byLoket: Object.values(byLoket),
                hourlyDistribution: hourlyData,
                queues: queues.map((q) => ({
                    code: q.code,
                    type: q.type,
                    status: q.status,
                    loket: q.loket?.name || '-',
                    createdAt: q.createdAt,
                    calledAt: q.calledAt,
                    finishedAt: q.finishedAt,
                })),
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
