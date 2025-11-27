import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/loket
 * Get all lokets with assignment info
 */
export async function GET() {
    try {
        const lokets = await prisma.loket.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                id: 'asc',
            },
        });

        return apiSuccess(lokets);
    } catch (error) {
        return handleApiError(error);
    }
}
