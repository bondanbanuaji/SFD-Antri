import { NextRequest, NextResponse } from 'next/server';
import { getQueueStats } from '@/lib/queue';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        if (!startDateStr || !endDateStr) {
            return NextResponse.json(
                { error: 'Start date and end date required' },
                { status: 400 }
            );
        }

        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        endDate.setHours(23, 59, 59, 999);

        const stats = await getQueueStats(startDate, endDate);

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}
