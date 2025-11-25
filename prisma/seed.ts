import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: await hashPassword('admin123'),
            name: 'Administrator',
            role: 'ADMIN',
        },
    });
    console.log('✅ Created admin user:', admin.username);

    // Create lokets
    const loket1 = await prisma.loket.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            name: 'Loket 1',
            status: 'OPEN',
        },
    });

    const loket2 = await prisma.loket.upsert({
        where: { id: 2 },
        update: {},
        create: {
            id: 2,
            name: 'Loket 2',
            status: 'OPEN',
        },
    });

    const loket3 = await prisma.loket.upsert({
        where: { id: 3 },
        update: {},
        create: {
            id: 3,
            name: 'Loket 3',
            status: 'OPEN',
        },
    });
    console.log('✅ Created 3 lokets');

    // Create petugas users
    const petugas1 = await prisma.user.upsert({
        where: { username: 'petugas1' },
        update: {},
        create: {
            username: 'petugas1',
            password: await hashPassword('petugas123'),
            name: 'Petugas Loket 1',
            role: 'PETUGAS',
        },
    });

    const petugas2 = await prisma.user.upsert({
        where: { username: 'petugas2' },
        update: {},
        create: {
            username: 'petugas2',
            password: await hashPassword('petugas123'),
            name: 'Petugas Loket 2',
            role: 'PETUGAS',
        },
    });

    const petugas3 = await prisma.user.upsert({
        where: { username: 'petugas3' },
        update: {},
        create: {
            username: 'petugas3',
            password: await hashPassword('petugas123'),
            name: 'Petugas Loket 3',
            role: 'PETUGAS',
        },
    });
    console.log('✅ Created 3 petugas users');

    // Assign petugas to lokets
    await prisma.loket.update({
        where: { id: 1 },
        data: { userId: petugas1.id },
    });

    await prisma.loket.update({
        where: { id: 2 },
        data: { userId: petugas2.id },
    });

    await prisma.loket.update({
        where: { id: 3 },
        data: { userId: petugas3.id },
    });
    console.log('✅ Assigned petugas to lokets');

    // Create some sample queues
    await prisma.queue.createMany({
        data: [
            {
                number: 1,
                code: 'U-001',
                type: 'UMUM',
                status: 'WAITING',
            },
            {
                number: 2,
                code: 'U-002',
                type: 'UMUM',
                status: 'WAITING',
            },
            {
                number: 1,
                code: 'B-001',
                type: 'BARANG',
                status: 'WAITING',
            },
        ],
    });
    console.log('✅ Created sample queues');

    console.log('🎉 Seed completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Admin: admin / admin123');
    console.log('Petugas: petugas1 / petugas123');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
