import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SQLite database...');

  // Clean existing entries
  await prisma.task.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create default administrator
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: passwordHash,
      name: 'Sarah Admin',
      role: 'ADMIN',
    },
  });

  // 2. Create default standard user
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: passwordHash,
      name: 'John User',
      role: 'USER',
    },
  });

  // 3. Create default tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Explore Prisma & Relational DBs',
        description: 'Read the Prisma schema and run migrations on SQLite/PostgreSQL.',
        status: 'DONE',
        userId: admin.id,
      },
      {
        title: 'Integrate MongoDB with Mongoose',
        description: 'Verify MongoDB memory server downloads and runs successfully in the background.',
        status: 'IN_PROGRESS',
        userId: user.id,
      },
      {
        title: 'Test WebSockets Real-Time Sync',
        description: 'Open two browser windows to test real-time task movement and instant chats.',
        status: 'TODO',
        userId: admin.id,
      },
    ],
  });

  console.log('Relational seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
