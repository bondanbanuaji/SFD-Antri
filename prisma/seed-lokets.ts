import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLokets() {
    console.log('🌱 Seeding lokets...');

    try {
        // Create exactly 3 lokets if they don't exist
        for (let i = 1; i <= 3; i++) {
            const loket = await prisma.loket.upsert({
                where: { id: i },
                update: {
                    name: `Loket ${i}`,
                },
                create: {
                    id: i,
                    name: `Loket ${i}`,
                    status: 'CLOSED',
                },
            });
            console.log(`✅ Loket ${i} created/updated:`, loket);
        }

        console.log('✅ Lokets seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding lokets:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedLokets()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
