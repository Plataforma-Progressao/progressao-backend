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

const CHECKLIST_TEMPLATES = [
  {
    code: 'PORTARIA_NOMEACAO',
    title: 'Portaria de Nomeação',
    description: 'Documento de nomeação no cargo atual.',
    category: 'administrativo',
    sortOrder: 1,
  },
  {
    code: 'RAD',
    title: 'Relatório Anual de Atividades (RAD)',
    description: 'RAD do ciclo de progressão em elaboração ou revisão.',
    category: 'relatorio',
    sortOrder: 2,
  },
  {
    code: 'PUBLICACAO_QUALIS',
    title: 'Comprovante de Publicação (A1/A2)',
    description: 'Requisito mínimo de artigos Qualis no período.',
    category: 'pesquisa',
    sortOrder: 3,
  },
  {
    code: 'ORIENTACAO_MESTRADO',
    title: 'Certificados de Orientação de Mestrado',
    description: 'Comprovantes de orientações concluídas ou em andamento.',
    category: 'ensino',
    sortOrder: 4,
  },
  {
    code: 'LATTES_PDF',
    title: 'Cópia do Currículo Lattes (PDF)',
    description: 'Versão atualizada do currículo Lattes em PDF.',
    category: 'curriculo',
    sortOrder: 5,
  },
  {
    code: 'DECLARACAO_CARGA',
    title: 'Declaração de Carga Horária',
    description: 'Declaração institucional de carga horária no período.',
    category: 'administrativo',
    sortOrder: 6,
  },
] as const;

async function seedChecklistTemplates(prisma: PrismaClient): Promise<void> {
  for (const template of CHECKLIST_TEMPLATES) {
    await prisma.checklistTemplateItem.upsert({
      where: { code: template.code },
      update: {
        title: template.title,
        description: template.description,
        category: template.category,
        sortOrder: template.sortOrder,
        isActive: true,
      },
      create: {
        code: template.code,
        title: template.title,
        description: template.description,
        category: template.category,
        sortOrder: template.sortOrder,
        isActive: true,
      },
    });
  }
}

async function seedAdminUser(prisma: PrismaClient): Promise<string> {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@progressao.uf.br';
  const adminName = process.env.ADMIN_NAME ?? 'Admin';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@123456';

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
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
      lastProgressionDate: new Date('2024-01-01'),
    },
  });

  return admin.id;
}

async function seedAdminProgressionAndChecklist(
  prisma: PrismaClient,
  adminId: string,
): Promise<void> {
  const existingCycle = await prisma.progressionCycle.findFirst({
    where: { userId: adminId, isActive: true },
  });

  const cycle =
    existingCycle ??
    (await prisma.progressionCycle.create({
      data: {
        userId: adminId,
        label: 'Ciclo 2024-2025',
        startsAt: new Date('2024-01-01'),
        endsAt: new Date('2025-12-31'),
        statusLabel: 'Em andamento',
        issuedAtLabel: '1 de janeiro de 2024',
        isActive: true,
      },
    }));

  const templates = await prisma.checklistTemplateItem.findMany({
    where: { isActive: true },
  });

  for (const template of templates) {
    await prisma.userChecklistItem.upsert({
      where: {
        userId_progressionCycleId_templateItemId: {
          userId: adminId,
          progressionCycleId: cycle.id,
          templateItemId: template.id,
        },
      },
      update: {},
      create: {
        userId: adminId,
        progressionCycleId: cycle.id,
        templateItemId: template.id,
      },
    });
  }
}

async function main(): Promise<void> {
  const prisma = createPrismaClient();

  try {
    await seedChecklistTemplates(prisma);
    const adminId = await seedAdminUser(prisma);
    await seedAdminProgressionAndChecklist(prisma, adminId);
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
