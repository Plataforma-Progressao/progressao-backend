import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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
  const prisma = new PrismaClient();

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
