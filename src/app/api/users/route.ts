import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import argon2 from 'argon2';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users
 * Get all users (Admin only)
 */
export async function GET(req: NextRequest) {
    try {
        // TODO: Add auth middleware to verify admin role
        
        const users = await prisma.user.findMany({
            include: {
                loket: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Remove password from response
        const usersWithoutPassword = users.map(({ password, ...user }) => user);

        return apiSuccess(usersWithoutPassword);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * POST /api/users
 * Create new user (Admin only)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { username, password, name, role, loketId } = body;

        // Validate required fields
        if (!username || !password || !name || !role) {
            return apiError('Username, password, name, and role are required', 'VALIDATION_ERROR', 400);
        }

        // Check if username already exists
        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            return apiError('Username already exists', 'USERNAME_EXISTS', 400);
        }

        // Hash password
        const hashedPassword = await argon2.hash(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                name,
                role,
            },
            include: {
                loket: true,
            },
        });

        // If loketId provided, assign loket
        if (loketId && role === 'PETUGAS') {
            await prisma.loket.update({
                where: { id: parseInt(loketId) },
                data: {
                    userId: user.id,
                    status: 'OPEN',
                },
            });
        }

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(
            { success: true, data: userWithoutPassword, message: 'User created successfully' },
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}
