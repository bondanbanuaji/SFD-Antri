import { prisma } from './prisma';

/**
 * Auto-assign an available loket to a user who doesn't have one
 */
export async function autoAssignLoket(userId: string) {
    // Find first loket without a user assigned
    const availableLoket = await prisma.loket.findFirst({
        where: {
            userId: null,
        },
    });

    if (!availableLoket) {
        // No available loket, create a new one
        const loketCount = await prisma.loket.count();
        const newLoket = await prisma.loket.create({
            data: {
                name: `Loket ${loketCount + 1}`,
                userId: userId,
                status: 'OPEN',
            },
        });
        return newLoket;
    }

    // Assign the available loket to the user
    const updatedLoket = await prisma.loket.update({
        where: { id: availableLoket.id },
        data: { userId: userId },
    });

    return updatedLoket;
}

/**
 * Unassign user from their loket (for logout or reassignment)
 */
export async function unassignLoket(userId: string) {
    await prisma.loket.updateMany({
        where: { userId: userId },
        data: { userId: null, status: 'CLOSED' },
    });
}
