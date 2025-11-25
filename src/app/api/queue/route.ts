import { NextRequest, NextResponse } from 'next/server';
import { generateQueueNumber } from '@/lib/queue';
import { emitQueueUpdate } from '@/lib/socket';

export async function POST(request: NextRequest) {
    try {
        const { type } = await request.json();

        if (!type || (type !== 'UMUM' && type !== 'BARANG')) {
            return NextResponse.json(
                { error: 'Invalid service type' },
                { status: 400 }
            );
        }

        const queue = await generateQueueNumber(type);

        // Emit real-time update
        emitQueueUpdate('queue:new', queue);

        return NextResponse.json(queue);
    } catch (error) {
        console.error('Error generating queue:', error);
        return NextResponse.json(
            { error: 'Failed to generate queue number' },
            { status: 500 }
        );
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

        return NextResponse.json(queues);
    } catch (error) {
        console.error('Error fetching queues:', error);
        return NextResponse.json(
            { error: 'Failed to fetch queues' },
            { status: 500 }
        );
    }
}
