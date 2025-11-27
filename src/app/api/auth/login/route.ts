import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { autoAssignLoket } from '@/lib/loket-utils';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

export async function POST(request: NextRequest) {
    try {
        // Rate limiting: 5 attempts per minute per IP
        const { rateLimiter } = await import('@/lib/redis');
        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        const { allowed, remaining, resetAt } = await rateLimiter.checkLimit(
            `login:${ip}`,
            5,  // max 5 attempts
            60  // per 60 seconds
        );

        if (!allowed) {
            const waitSeconds = Math.ceil((resetAt - Date.now()) / 1000);
            return NextResponse.json(
                {
                    error: `Terlalu banyak percobaan login. Coba lagi dalam ${waitSeconds} detik`,
                    retryAfter: waitSeconds
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': waitSeconds.toString(),
                        'X-RateLimit-Remaining': remaining.toString(),
                    }
                }
            );
        }

        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password required' },
                { status: 400 }
            );
        }

        console.log(`🔐 Login attempt for: ${username}`);
        let user = await authenticateUser(username, password);

        if (!user) {
            console.warn(`❌ Login failed for user: ${username} - Invalid credentials`);
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }
        console.log(`✅ Login successful for: ${username} (Role: ${user.role})`);

        // Auto-assign loket for PETUGAS if not assigned
        const userWithLoket = user as any; // Type assertion to access loket property
        if (user.role === 'PETUGAS' && !userWithLoket.loket) {
            console.log(`Auto-assigning loket for user: ${user.username}`);
            await autoAssignLoket(user.id);

            // Refresh user data with loket
            const updatedUser = await prisma.user.findUnique({
                where: { id: user.id },
                include: { loket: true },
            });

            if (updatedUser) {
                user = updatedUser as any;
            }
        }

        // Create JWT token
        const { getJWTSecret } = await import('@/lib/auth');
        const secret = getJWTSecret();

        const token = await new SignJWT({
            userId: user!.id,
            username: user!.username,
            role: user!.role,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(secret);

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
        });

        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = user as any;

        return NextResponse.json({
            user: userWithoutPassword,
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
}
