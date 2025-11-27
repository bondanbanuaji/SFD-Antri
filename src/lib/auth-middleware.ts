import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-this');

interface JWTPayload {
    userId: string;
    username: string;
    role: string;
    name: string;
}

/**
 * Get current user from request headers (set by middleware)
 */
export function getCurrentUser(request: NextRequest): JWTPayload | null {
    const userId = request.headers.get('x-user-id');
    const role = request.headers.get('x-user-role');
    const name = request.headers.get('x-user-name');
    const username = request.headers.get('x-user-username');

    if (!userId || !role) {
        return null;
    }

    return {
        userId,
        username: username || '',
        role,
        name: name || '',
    };
}

/**
 * Verify JWT token manually (for API routes)
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as unknown as JWTPayload;
    } catch {
        return null;
    }
}

/**
 * Require authentication for API route
 */
export async function requireAuth(request: NextRequest): Promise<{
    user: JWTPayload | null;
    error: NextResponse | null;
}> {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
        return {
            user: null,
            error: NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            ),
        };
    }

    const user = await verifyToken(token);

    if (!user) {
        return {
            user: null,
            error: NextResponse.json(
                { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } },
                { status: 401 }
            ),
        };
    }

    return { user, error: null };
}

/**
 * Require specific role for API route
 */
export async function requireRole(
    request: NextRequest,
    allowedRoles: string[]
): Promise<{
    user: JWTPayload | null;
    error: NextResponse | null;
}> {
    const { user, error } = await requireAuth(request);

    if (error) {
        return { user: null, error };
    }

    if (user && !allowedRoles.includes(user.role)) {
        return {
            user: null,
            error: NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
                { status: 403 }
            ),
        };
    }

    return { user, error: null };
}
