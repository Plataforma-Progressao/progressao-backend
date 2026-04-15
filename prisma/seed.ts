import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to run the seed.');
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

async function seedAdminUser(prisma: PrismaClient): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@progressao.uf.br';
  const adminName = process.env.ADMIN_NAME ?? 'Admin';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@123456';

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash,
      role: Role.ADMIN,
    },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash,
      role: Role.ADMIN,
    },
  });
}

async function main(): Promise<void> {
  const prisma = createPrismaClient();

  try {
    await seedAdminUser(prisma);
    // eslint-disable-next-line no-console
    console.log('Seed concluido com sucesso.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Erro ao executar seed:', error);
  process.exit(1);
});
