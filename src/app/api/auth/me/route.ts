import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/me
 * Get current authenticated user info
 */
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        const user = await verifyToken(token);

        if (!user) {
            return NextResponse.json(
                { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid token' } },
                { status: 401 }
            );
        }

        // Get full user data with loket info
        const fullUser = await prisma.user.findUnique({
            where: { id: user.userId },
            include: {
                loket: true,
            },
        });

        if (!fullUser) {
            return NextResponse.json(
                { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                id: fullUser.id,
                username: fullUser.username,
                name: fullUser.name,
                role: fullUser.role,
            },
            loket: fullUser.loket,
        });
    } catch (error) {
        console.error('Error in /api/auth/me:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
            { status: 500 }
        );
    }
}
