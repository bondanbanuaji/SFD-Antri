import { NextRequest, NextResponse } from 'next/server';
import { callQueue, skipQueue, completeQueue } from '@/lib/queue';
import { emitQueueUpdate } from '@/lib/socket';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { action, loketId } = await request.json();

        const queueId = parseInt(id);

        if (isNaN(queueId)) {
            return NextResponse.json({ error: 'Invalid queue ID' }, { status: 400 });
        }

        let updatedQueue;

        switch (action) {
            case 'call':
                if (!loketId) {
                    return NextResponse.json(
                        { error: 'Loket ID required' },
                        { status: 400 }
                    );
                }
                updatedQueue = await callQueue(queueId, parseInt(loketId));
                emitQueueUpdate('queue:called', updatedQueue);
                break;

            case 'complete':
                updatedQueue = await completeQueue(queueId);
                emitQueueUpdate('queue:completed', updatedQueue);
                break;

            case 'skip':
                updatedQueue = await skipQueue(queueId);
                emitQueueUpdate('queue:skipped', updatedQueue);
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json(updatedQueue);
    } catch (error) {
        console.error('Error updating queue:', error);
        return NextResponse.json(
            { error: 'Failed to update queue' },
            { status: 500 }
        );
    }
}
