import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        return false;
    }
}

export async function authenticateUser(
    username: string,
    password: string
): Promise<User | null> {
    const user = await prisma.user.findUnique({
        where: { username },
        include: { loket: true },
    });

    if (!user) {
        return null;
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
        return null;
    }

    return user;
}

export async function createUser(
    username: string,
    password: string,
    name: string,
    role: 'ADMIN' | 'PETUGAS' = 'PETUGAS'
) {
    const hashedPassword = await hashPassword(password);

    return await prisma.user.create({
        data: {
            username,
            password: hashedPassword,
            name,
            role,
        },
    });
}

// JWT Secret Management
export function getJWTSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error(
                'FATAL: JWT_SECRET environment variable is required in production'
            );
        }

        console.warn('⚠️  WARNING: JWT_SECRET not set. Using insecure default for development only.');
        console.warn('⚠️  Set JWT_SECRET environment variable before deploying to production!');
        return new TextEncoder().encode('insecure-dev-secret-change-this');
    }

    if (secret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long');
    }

    return new TextEncoder().encode(secret);
}

// Token Blacklist Functions
export async function revokeToken(token: string): Promise<boolean> {
    try {
        const { cache } = await import('@/lib/redis');
        const { jwtVerify } = await import('jose');
        const secret = getJWTSecret();

        const { payload } = await jwtVerify(token, secret);
        const expiry = payload.exp ? (payload.exp - Math.floor(Date.now() / 1000)) : 3600;

        await cache.set(`blacklist:${token}`, true, expiry);
        console.log('🚫 Token revoked:', payload.userId);
        return true;
    } catch (error) {
        console.error('Error revoking token:', error);
        return false;
    }
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
    try {
        const { cache } = await import('@/lib/redis');
        const blacklisted = await cache.get(`blacklist:${token}`);
        return !!blacklisted;
    } catch (error) {
        console.error('Error checking token blacklist:', error);
        return false;
    }
}
