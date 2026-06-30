import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import {
  ActivityCategory,
  ActivityStatus,
  ChecklistItemStatus,
  PrismaClient,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to run the seed.');
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const SEED_PASSWORD =
  process.env.SEED_PASSWORD ?? process.env.ADMIN_PASSWORD ?? 'Seed@123456';

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

interface SeedUserConfig {
  email: string;
  name: string;
  roles: Role[];
  department?: string;
  university?: string;
  careerClass?: string;
  currentLevel?: string;
}

const DEMO_USERS: SeedUserConfig[] = [
  {
    email: process.env.ADMIN_EMAIL ?? 'admin@progressao.uf.br',
    name: process.env.ADMIN_NAME ?? 'Administrador',
    roles: [Role.ADMIN],
  },
  {
    email: process.env.DOCENTE1_EMAIL ?? 'docente1@progressao.uf.br',
    name: 'Ana Silva',
    roles: [Role.USER],
    department: 'Departamento de Computação',
    university: 'Universidade Federal de Progressão',
    careerClass: 'Professor',
    currentLevel: 'III',
  },
  {
    email: process.env.DOCENTE2_EMAIL ?? 'docente2@progressao.uf.br',
    name: 'Carlos Mendes',
    roles: [Role.USER],
    department: 'Departamento de Matemática',
    university: 'Universidade Federal de Progressão',
    careerClass: 'Professor',
    currentLevel: 'II',
  },
  {
    email: process.env.DOCENTE3_EMAIL ?? 'docente3@progressao.uf.br',
    name: 'Patricia Souza',
    roles: [Role.USER],
    department: 'Departamento de Química',
    university: 'Universidade Federal de Progressão',
    careerClass: 'Professor',
    currentLevel: 'II',
  },
  {
    email: process.env.REVISOR_EMAIL ?? 'revisor@progressao.uf.br',
    name: 'Maria Revisora',
    roles: [Role.EVALUATOR],
    department: 'PROGRAD',
    university: 'Universidade Federal de Progressão',
  },
  {
    email:
      process.env.DOCENTE_REVISOR_EMAIL ?? 'docente.revisor@progressao.uf.br',
    name: 'João Docente-Revisor',
    roles: [Role.USER, Role.EVALUATOR],
    department: 'Departamento de Física',
    university: 'Universidade Federal de Progressão',
    careerClass: 'Professor',
    currentLevel: 'IV',
  },
];

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

async function bootstrapDocente(
  prisma: PrismaClient,
  userId: string,
  lastProgressionDate: Date,
): Promise<string> {
  await prisma.progressionCycle.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });

  const startYear = lastProgressionDate.getUTCFullYear();
  const cycle = await prisma.progressionCycle.create({
    data: {
      userId,
      label: `Ciclo ${startYear}-${startYear + 1}`,
      startsAt: new Date(Date.UTC(startYear, 0, 1)),
      endsAt: new Date(Date.UTC(startYear + 1, 11, 31, 23, 59, 59)),
      statusLabel: 'Em andamento',
      issuedAtLabel: '1 de janeiro de 2024',
      isActive: true,
    },
  });

  const templates = await prisma.checklistTemplateItem.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  await prisma.userChecklistItem.createMany({
    data: templates.map((template) => ({
      userId,
      progressionCycleId: cycle.id,
      templateItemId: template.id,
      status: ChecklistItemStatus.PENDING,
    })),
    skipDuplicates: true,
  });

  return cycle.id;
}

async function seedUser(
  prisma: PrismaClient,
  config: SeedUserConfig,
  passwordHash: string,
): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: config.email },
    update: {
      name: config.name,
      passwordHash,
      roles: config.roles,
      department: config.department ?? null,
      university: config.university ?? null,
      careerClass: config.careerClass ?? null,
      currentLevel: config.currentLevel ?? null,
      acceptTerms: true,
      acceptLgpd: true,
    },
    create: {
      email: config.email,
      name: config.name,
      passwordHash,
      roles: config.roles,
      department: config.department ?? null,
      university: config.university ?? null,
      careerClass: config.careerClass ?? null,
      currentLevel: config.currentLevel ?? null,
      lastProgressionDate: new Date('2024-01-01'),
      acceptTerms: true,
      acceptLgpd: true,
    },
  });

  if (config.roles.includes(Role.USER)) {
    const existingCycle = await prisma.progressionCycle.findFirst({
      where: { userId: user.id, isActive: true },
    });

    if (!existingCycle) {
      await bootstrapDocente(prisma, user.id, new Date('2024-01-01'));
    }
  }

  return user.id;
}

async function seedDemoActivities(
  prisma: PrismaClient,
  userId: string,
  cycleId: string,
): Promise<void> {
  const existing = await prisma.activity.count({ where: { userId } });
  if (existing > 0) {
    return;
  }

  const now = new Date();

  await prisma.activity.createMany({
    data: [
      {
        userId,
        progressionCycleId: cycleId,
        title: 'Disciplina de Algoritmos',
        description: 'Ministração de disciplina de graduação no semestre atual.',
        category: ActivityCategory.TEACHING,
        workloadHours: 60,
        score: 13.8,
        term: '2025.1',
        kind: 'Disciplina',
        status: ActivityStatus.PENDING,
        submittedAt: now,
      },
      {
        userId,
        progressionCycleId: cycleId,
        title: 'Artigo Qualis A1',
        description: 'Publicação em periódico internacional indexado.',
        category: ActivityCategory.RESEARCH,
        workloadHours: 40,
        score: 17.5,
        term: '2024',
        kind: 'Publicação',
        status: ActivityStatus.PENDING,
        submittedAt: now,
      },
      {
        userId,
        progressionCycleId: cycleId,
        title: 'Projeto de Extensão Comunitária',
        description: 'Projeto de extensão com comunidade local.',
        category: ActivityCategory.OUTREACH,
        workloadHours: 30,
        score: 13.9,
        term: '2024',
        kind: 'Projeto',
        status: ActivityStatus.APPROVED,
        submittedAt: new Date('2024-06-01'),
        reviewedAt: new Date('2024-06-15'),
      },
      {
        userId,
        progressionCycleId: cycleId,
        title: 'Coordenação de curso (rejeitada)',
        description: 'Atividade de gestão com documentação incompleta.',
        category: ActivityCategory.MANAGEMENT,
        workloadHours: 20,
        score: 9.3,
        term: '2023',
        kind: 'Gestão',
        status: ActivityStatus.REJECTED,
        submittedAt: new Date('2024-03-01'),
        reviewedAt: new Date('2024-03-10'),
        rejectionReason: 'Documentação comprobatória insuficiente.',
      },
    ],
  });
}

async function seedEvaluatorAssignments(
  prisma: PrismaClient,
  userIds: Record<string, string>,
  adminId: string,
): Promise<void> {
  const revisorEmail = process.env.REVISOR_EMAIL ?? 'revisor@progressao.uf.br';
  const docente1Email = process.env.DOCENTE1_EMAIL ?? 'docente1@progressao.uf.br';
  const docente2Email = process.env.DOCENTE2_EMAIL ?? 'docente2@progressao.uf.br';

  const revisorId = userIds[revisorEmail];
  const docente1Id = userIds[docente1Email];
  const docente2Id = userIds[docente2Email];

  if (!revisorId || !docente1Id || !docente2Id) {
    return;
  }

  for (const teacherId of [docente1Id, docente2Id]) {
    await prisma.evaluatorAssignment.upsert({
      where: { teacherId },
      update: {
        evaluatorId: revisorId,
        assignedById: adminId,
      },
      create: {
        teacherId,
        evaluatorId: revisorId,
        assignedById: adminId,
      },
    });
  }
}

async function seedBarema(prisma: PrismaClient): Promise<void> {
  const config = await prisma.baremaConfig.upsert({
    where: { university: 'UF Demo' },
    update: { isActive: true, scoreTarget: 2000 },
    create: {
      university: 'UF Demo',
      scoreTarget: 2000,
      isActive: true,
    },
  });

  const categoryRules = [
    {
      category: ActivityCategory.TEACHING,
      baseScore: 10,
      workloadMultiplier: 0.0625,
      ceilingScore: 800,
      minimumTarget: 400,
    },
    {
      category: ActivityCategory.RESEARCH,
      baseScore: 15,
      workloadMultiplier: 0.0625,
      ceilingScore: 1000,
      minimumTarget: 500,
    },
    {
      category: ActivityCategory.OUTREACH,
      baseScore: 12,
      workloadMultiplier: 0.0625,
      ceilingScore: 600,
      minimumTarget: 200,
    },
    {
      category: ActivityCategory.MANAGEMENT,
      baseScore: 8,
      workloadMultiplier: 0.0625,
      ceilingScore: 400,
      minimumTarget: 100,
    },
  ] as const;

  for (const rule of categoryRules) {
    await prisma.baremaCategoryRule.upsert({
      where: {
        baremaConfigId_category: {
          baremaConfigId: config.id,
          category: rule.category,
        },
      },
      update: {
        baseScore: rule.baseScore,
        workloadMultiplier: rule.workloadMultiplier,
        ceilingScore: rule.ceilingScore,
        minimumTarget: rule.minimumTarget,
      },
      create: {
        baremaConfigId: config.id,
        ...rule,
      },
    });
  }

  const activityRules = [
    {
      category: ActivityCategory.TEACHING,
      kind: 'Disciplina ministrada',
      keywords: ['disciplina', 'ensino', 'aula', 'graduacao'],
      fixedScore: 10,
      priority: 10,
    },
    {
      category: ActivityCategory.RESEARCH,
      kind: 'Publicacao Qualis A1',
      keywords: ['qualis', 'publicacao', 'artigo', 'revista'],
      fixedScore: 15,
      priority: 20,
    },
    {
      category: ActivityCategory.OUTREACH,
      kind: 'Projeto de extensao',
      keywords: ['extensao', 'comunidade', 'projeto'],
      fixedScore: 12,
      priority: 15,
    },
    {
      category: ActivityCategory.MANAGEMENT,
      kind: 'Coordenacao de curso',
      keywords: ['coordenacao', 'gestao', 'direcao'],
      fixedScore: 8,
      priority: 12,
    },
  ] as const;

  for (const rule of activityRules) {
    const existing = await prisma.baremaActivityRule.findFirst({
      where: {
        baremaConfigId: config.id,
        kind: rule.kind,
        category: rule.category,
      },
    });

    if (existing) {
      await prisma.baremaActivityRule.update({
        where: { id: existing.id },
        data: {
          keywords: [...rule.keywords],
          fixedScore: rule.fixedScore,
          priority: rule.priority,
          isActive: true,
        },
      });
    } else {
      await prisma.baremaActivityRule.create({
        data: {
          baremaConfigId: config.id,
          category: rule.category,
          kind: rule.kind,
          keywords: [...rule.keywords],
          fixedScore: rule.fixedScore,
          priority: rule.priority,
          isActive: true,
        },
      });
    }
  }
}

async function main(): Promise<void> {
  const prisma = createPrismaClient();
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  try {
    await seedChecklistTemplates(prisma);
    await seedBarema(prisma);

    const userIds: Record<string, string> = {};

    for (const config of DEMO_USERS) {
      userIds[config.email] = await seedUser(prisma, config, passwordHash);
    }

    for (const email of [
      process.env.DOCENTE1_EMAIL ?? 'docente1@progressao.uf.br',
      process.env.DOCENTE2_EMAIL ?? 'docente2@progressao.uf.br',
      process.env.DOCENTE3_EMAIL ?? 'docente3@progressao.uf.br',
    ]) {
      const userId = userIds[email];
      const cycle = await prisma.progressionCycle.findFirst({
        where: { userId, isActive: true },
      });
      if (cycle) {
        await seedDemoActivities(prisma, userId, cycle.id);
      }
    }

    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@progressao.uf.br';
    await seedEvaluatorAssignments(prisma, userIds, userIds[adminEmail]);

    // eslint-disable-next-line no-console
    console.log('Seed concluido com sucesso.');
    // eslint-disable-next-line no-console
    console.log(`Senha padrao dos usuarios de demo: ${SEED_PASSWORD}`);
    // eslint-disable-next-line no-console
    console.log('Usuarios:');
    for (const config of DEMO_USERS) {
      // eslint-disable-next-line no-console
      console.log(
        `  - ${config.email} [${config.roles.join(', ')}]`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Erro ao executar seed:', error);
  process.exit(1);
});
