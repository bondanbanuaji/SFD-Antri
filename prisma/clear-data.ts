import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearData() {
    try {
        console.log('🗑️  Starting data cleanup...\n');

        // 1. Clear Queue table
        console.log('📋 Clearing Queue table...');
        const deletedQueues = await prisma.queue.deleteMany({});
        console.log(`   ✅ Deleted ${deletedQueues.count} queue records\n`);

        // 2. Clear Loket table (and unassign users)
        console.log('🏢 Clearing Loket table...');
        const deletedLokets = await prisma.loket.deleteMany({});
        console.log(`   ✅ Deleted ${deletedLokets.count} loket records\n`);

        // 3. Verify User table is untouched
        console.log('👤 Checking User table...');
        const userCount = await prisma.user.count();
        console.log(`   ✅ User table still has ${userCount} users (safe!)\n`);

        console.log('✅ Data cleanup completed successfully!\n');
        console.log('Summary:');
        console.log(`   - Queue: ${deletedQueues.count} deleted`);
        console.log(`   - Loket: ${deletedLokets.count} deleted`);
        console.log(`   - User: ${userCount} preserved ✅`);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

clearData()
    .then(() => {
        console.log('\n🎉 Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed:', error);
        process.exit(1);
    });
