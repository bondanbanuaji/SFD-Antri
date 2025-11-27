import { NextRequest, NextResponse } from 'next/server';
import { callQueue, skipQueue, completeQueue } from '@/lib/queue';
import { emitQueueUpdate } from '@/lib/socket';

async function handleQueueUpdate(
    request: NextRequest,
    params: Promise<{ id: string }>
) {
    try {
        const { id } = await params;
        const { action, loketId } = await request.json();

        console.log(`\n🎯 [API] Queue update request:`);
        console.log(`   - Queue ID: ${id}`);
        console.log(`   - Action: ${action}`);
        console.log(`   - Loket ID: ${loketId}`);

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
                
                // VALIDATE LOKET EXISTS
                const { prisma } = await import('@/lib/prisma');
                const loketExists = await prisma.loket.findUnique({
                    where: { id: parseInt(loketId) }
                });
                
                if (!loketExists) {
                    console.error(`❌ Invalid loket ID: ${loketId}`);
                    return NextResponse.json(
                        { error: `Loket ${loketId} tidak ditemukan dalam sistem` },
                        { status: 400 }
                    );
                }
                
                console.log(`   - Calling queue ${queueId} for loket ${loketId}`);
                updatedQueue = await callQueue(queueId, parseInt(loketId));
                console.log(`   - Queue updated in DB:`, {
                    id: updatedQueue.id,
                    code: updatedQueue.code,
                    loketId: updatedQueue.loketId,
                    loket: updatedQueue.loket,
                    status: updatedQueue.status
                });
                console.log(`   - Emitting queue:called event...`);
                emitQueueUpdate('queue:called', updatedQueue);
                console.log(`   ✅ Event emitted successfully\n`);
                break;

            case 'complete':
                console.log(`   - Completing queue ${queueId}`);
                updatedQueue = await completeQueue(queueId);
                console.log(`   - Queue completed in DB:`, {
                    id: updatedQueue.id,
                    code: updatedQueue.code,
                    loketId: updatedQueue.loketId,
                    loket: updatedQueue.loket,
                    status: updatedQueue.status
                });
                
                // CRITICAL: Ensure loketId exists for Display to know which slot to clear
                if (!updatedQueue.loketId) {
                    console.error(`   ❌ WARNING: Queue ${updatedQueue.code} completed without loketId!`);
                }
                
                console.log(`   - Emitting queue:completed event...`);
                emitQueueUpdate('queue:completed', updatedQueue);
                console.log(`   ✅ Event emitted successfully\n`);
                break;

            case 'skip':
                console.log(`   - Skipping queue ${queueId}`);
                updatedQueue = await skipQueue(queueId);
                console.log(`   - Queue skipped in DB:`, {
                    id: updatedQueue.id,
                    code: updatedQueue.code,
                    loketId: updatedQueue.loketId,
                    loket: updatedQueue.loket,
                    status: updatedQueue.status
                });
                
                // CRITICAL: Ensure loketId exists for Display to know which slot to clear
                if (!updatedQueue.loketId) {
                    console.error(`   ❌ WARNING: Queue ${updatedQueue.code} skipped without loketId!`);
                }
                
                console.log(`   - Emitting queue:skipped event...`);
                emitQueueUpdate('queue:skipped', updatedQueue);
                console.log(`   ✅ Event emitted successfully\n`);
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json(updatedQueue);
    } catch (error) {
        console.error('❌ [API] Error updating queue:', error);
        return NextResponse.json(
            { error: 'Failed to update queue' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return handleQueueUpdate(request, params);
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return handleQueueUpdate(request, params);
}
