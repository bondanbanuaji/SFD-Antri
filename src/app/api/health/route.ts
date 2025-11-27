import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import redis from '@/lib/redis';

export async function GET() {
    const checks = {
        database: false,
        redis: false,
        socket: false,
    };

    let allHealthy = true;

    // Check Database
    try {
        await prisma.$queryRaw`SELECT 1`;
        checks.database = true;
    } catch (error) {
        console.error('[Health Check] Database error:', error);
        checks.database = false;
        allHealthy = false;
    }

    // Check Redis
    try {
        await redis.ping();
        checks.redis = true;
    } catch (error) {
        console.error('[Health Check] Redis error:', error);
        checks.redis = false;
        allHealthy = false;
    }

    // Check Socket.io
    try {
        checks.socket = !!globalThis.io;
        if (!checks.socket) {
            allHealthy = false;
        }
    } catch (error) {
        console.error('[Health Check] Socket.io error:', error);
        checks.socket = false;
        allHealthy = false;
    }

    const status = allHealthy ? 'healthy' : 'unhealthy';
    const statusCode = allHealthy ? 200 : 503;

    return NextResponse.json(
        {
            status,
            timestamp: new Date().toISOString(),
            checks,
            version: process.env.npm_package_version || '1.0.0'
        },
        { status: statusCode }
    );
}
