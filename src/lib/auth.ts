import argon2 from 'argon2';
import { User } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
}

export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    try {
        return await argon2.verify(hash, password);
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
