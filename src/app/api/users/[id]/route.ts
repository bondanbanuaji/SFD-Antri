import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import argon2 from 'argon2';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/[id]
 * Get user by ID
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                loket: true,
            },
        });

        if (!user) {
            return apiError('User not found', 'USER_NOT_FOUND', 404);
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user;

        return apiSuccess(userWithoutPassword);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * PATCH /api/users/[id]
 * Update user
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, role, password, loketId } = body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return apiError('User not found', 'USER_NOT_FOUND', 404);
        }

        // Prepare update data
        const updateData: any = {};
        if (name) updateData.name = name;
        if (role) updateData.role = role;
        if (password) {
            updateData.password = await argon2.hash(password);
        }

        // Update user
        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            include: {
                loket: true,
            },
        });

        // Handle loket assignment
        if (loketId !== undefined) {
            if (loketId) {
                // Assign to new loket
                // First, remove user from current loket if any
                if (user.loket) {
                    await prisma.loket.update({
                        where: { id: user.loket.id },
                        data: {
                            userId: null,
                            status: 'CLOSED',
                        },
                    });
                }

                // Assign to new loket
                await prisma.loket.update({
                    where: { id: parseInt(loketId) },
                    data: {
                        userId: user.id,
                        status: 'OPEN',
                    },
                });
            } else {
                // Remove from loket
                if (user.loket) {
                    await prisma.loket.update({
                        where: { id: user.loket.id },
                        data: {
                            userId: null,
                            status: 'CLOSED',
                        },
                    });
                }
            }
        }

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            success: true,
            data: userWithoutPassword,
            message: 'User updated successfully',
            meta: { timestamp: new Date().toISOString() }
        });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * DELETE /api/users/[id]
 * Delete user
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                loket: true,
            },
        });

        if (!user) {
            return apiError('User not found', 'USER_NOT_FOUND', 404);
        }

        // If user has loket, unassign first
        if (user.loket) {
            await prisma.loket.update({
                where: { id: user.loket.id },
                data: {
                    userId: null,
                    status: 'CLOSED',
                },
            });
        }

        // Delete user
        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            data: null,
            message: 'User deleted successfully',
            meta: { timestamp: new Date().toISOString() }
        });
    } catch (error) {
        return handleApiError(error);
    }
}
