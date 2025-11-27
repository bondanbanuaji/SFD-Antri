import { PrismaClient, LoketStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLokets() {
    try {
        console.log('🏢 Seeding Loket data...\n');

        // Create 3 standard lokets
        const lokets = [
            { name: 'Loket 1', status: LoketStatus.CLOSED },
            { name: 'Loket 2', status: LoketStatus.CLOSED },
            { name: 'Loket 3', status: LoketStatus.CLOSED },
        ];

        for (const loket of lokets) {
            const created = await prisma.loket.create({
                data: loket,
            });
            console.log(`   ✅ Created ${created.name}`);
        }

        console.log('\n✅ Loket seeding completed!\n');

    } catch (error) {
        console.error('❌ Error seeding lokets:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedLokets()
    .then(() => {
        console.log('🎉 Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed:', error);
        process.exit(1);
    });
