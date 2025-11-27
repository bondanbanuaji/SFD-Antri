import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getJWTSecret, isTokenBlacklisted } from '@/lib/auth';

// Request body size limit (1MB)
const MAX_REQUEST_SIZE = 1024 * 1024;

interface JWTPayload {
    userId: string;
    username: string;
    role: string;
    name: string;
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check request body size for POST/PUT/PATCH requests
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
        return NextResponse.json(
            { error: 'Ukuran request terlalu besar. Maksimal 1MB' },
            { status: 413 }
        );
    }

    // Public routes - no authentication required
    const publicRoutes = ['/', '/kiosk', '/display', '/login'];
    if (publicRoutes.includes(pathname)) {
        return NextResponse.next();
    }

    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
        // Redirect to login if no token
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Check if token is blacklisted
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        loginUrl.searchParams.set('reason', 'session-expired');

        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('auth-token');
        return response;
    }

    try {
        // Verify JWT token
        const secret = getJWTSecret();
        const { payload } = await jwtVerify(token, secret);
        const user = payload as unknown as JWTPayload;

        // Role-based access control
        if (pathname.startsWith('/admin')) {
            if (user.role !== 'ADMIN') {
                // Not an admin, redirect to appropriate dashboard
                return NextResponse.redirect(new URL('/loket', request.url));
            }
        }

        if (pathname.startsWith('/loket')) {
            if (user.role !== 'PETUGAS' && user.role !== 'ADMIN') {
                // Not authorized for loket
                return NextResponse.redirect(new URL('/', request.url));
            }
        }

        // Add user info to headers for API routes
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', user.userId);
        requestHeaders.set('x-user-role', user.role);
        requestHeaders.set('x-user-name', user.name);

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    } catch (error) {
        // Invalid token, redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);

        // Clear invalid token
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('auth-token');

        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - socket.io (Socket.io)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|socket.io).*)',
    ],
};
