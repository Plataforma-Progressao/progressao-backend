import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ActivityListItemDto,
  ListActivitiesResponseDto,
} from './dto/list-activities.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { EstimateActivityScoreDto } from './dto/estimate-activity-score.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { UploadedEvidenceFile } from './types/uploaded-evidence-file';

type ActivityRecord = {
  id: string;
  userId: string;
  progressionCycleId: string | null;
  title: string;
  description: string;
  category: string;
  workloadHours: number;
  score: Prisma.Decimal | number | string;
  term: string | null;
  kind: string | null;
  status: string;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewerId: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ActivityEvidenceRecord = {
  id: string;
  activityId: string;
  type: string;
  filename: string | null;
  originalName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  storagePath: string | null;
  externalUrl: string | null;
  uploadedById: string | null;
  createdAt: Date;
};

type ActivityCreateInput = {
  userId: string;
  title: string;
  description: string;
  category: string;
  workloadHours: number;
  score: Prisma.Decimal;
  term: string | null;
  kind: string | null;
  status: string;
  submittedAt: Date;
};

type ActivityUpdateInput = Partial<
  Pick<
    ActivityCreateInput,
    | 'title'
    | 'description'
    | 'category'
    | 'workloadHours'
    | 'score'
    | 'term'
    | 'kind'
  >
>;

interface ActivitiesDatabase {
  activity: {
    findMany(args: {
      where: { userId: string };
      orderBy: { createdAt: 'desc' };
    }): Promise<ActivityRecord[]>;
    findFirst(args: {
      where: { id: string; userId: string };
    }): Promise<ActivityRecord | null>;
    create(args: { data: ActivityCreateInput }): Promise<ActivityRecord>;
    update(args: {
      where: { id: string };
      data: ActivityUpdateInput;
    }): Promise<ActivityRecord>;
    delete(args: { where: { id: string } }): Promise<ActivityRecord>;
  };
  activityEvidence: {
    create(args: {
      data: {
        activityId: string;
        type: string;
        filename: string | null;
        originalName: string | null;
        mimeType: string | null;
        sizeBytes: number | null;
        storagePath: string | null;
        uploadedById: string | null;
      };
    }): Promise<ActivityEvidenceRecord>;
    findFirst(args: {
      where: { id: string; activity: { userId: string } };
      select: { id: true };
    }): Promise<{ id: string } | null>;
    delete(args: { where: { id: string } }): Promise<ActivityEvidenceRecord>;
  };
}

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): ActivitiesDatabase {
    return this.prisma as unknown as ActivitiesDatabase;
  }

  async getLegacyReport(userId: string): Promise<ListActivitiesResponseDto> {
    return {
      userData: {
        id: userId,
        name: 'Dr. Manuel Rocha',
        siapeId: '19827364-0',
        department: 'Ciencias da Computacao',
        workRegime: 'Dedicacao Exclusiva (DE)',
      },
      metadata: {
        institution: 'UNIVERSIDADE FEDERAL DO CONHECIMENTO',
        graduateOfficeTitle: 'PRO-REITORIA DE GRADUACAO E PESQUISA',
        documentLabel: 'DOCUMENTO PRELIMINAR',
        cycleLabel: 'Ciclo 2023/2024',
        issuedAtLabel: '24 de maio de 2024',
        cycleStatus: 'Em conformidade',
      },
      activities: this.mockActivities,
    };
  }

  async findAll(userId: string): Promise<readonly ActivityListItemDto[]> {
    const activities = await this.db.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return activities.map((activity) => this.toListItem(activity));
  }

  async findById(userId: string, id: string): Promise<ActivityListItemDto> {
    const activity = await this.findOwnedActivity(userId, id);
    return this.toListItem(activity);
  }

  async create(
    userId: string,
    dto: CreateActivityDto,
  ): Promise<ActivityListItemDto> {
    const activity = await this.db.activity.create({
      data: {
        userId,
        title: dto.title.trim(),
        description: dto.description.trim(),
        category: dto.category,
        workloadHours: dto.workloadHours,
        score: new Prisma.Decimal(dto.score),
        term: dto.term?.trim() || null,
        kind: dto.kind?.trim() || null,
        status: 'PENDING',
        submittedAt: new Date(),
      },
    });

    return this.toListItem(activity);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateActivityDto,
  ): Promise<ActivityListItemDto> {
    await this.findOwnedActivity(userId, id);

    const activity = await this.db.activity.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        category: dto.category,
        workloadHours: dto.workloadHours,
        score:
          dto.score === undefined ? undefined : new Prisma.Decimal(dto.score),
        term: dto.term === undefined ? undefined : dto.term?.trim() || null,
        kind: dto.kind === undefined ? undefined : dto.kind?.trim() || null,
      },
    });

    return this.toListItem(activity);
  }

  async remove(userId: string, id: string): Promise<{ id: string }> {
    await this.findOwnedActivity(userId, id);
    await this.db.activity.delete({ where: { id } });

    return { id };
  }

  async uploadEvidence(
    userId: string,
    activityId: string,
    file: UploadedEvidenceFile | undefined,
  ): Promise<{
    id: string;
    filename: string;
    originalName: string;
    size: number;
    url?: string;
  }> {
    const activity = await this.findOwnedActivity(userId, activityId);
    this.validateEvidenceFile(file);

    const evidence = await this.db.activityEvidence.create({
      data: {
        activityId: activity.id,
        type: 'FILE',
        filename: file?.filename ?? file?.originalname ?? null,
        originalName: file?.originalname ?? null,
        mimeType: file?.mimetype ?? null,
        sizeBytes: file?.size ?? null,
        storagePath: file?.filename ? `uploads/${file.filename}` : null,
        uploadedById: userId,
      },
    });

    return this.toEvidenceUploadResponse(evidence);
  }

  async deleteEvidence(
    userId: string,
    evidenceId: string,
  ): Promise<{ id: string }> {
    const evidence = await this.db.activityEvidence.findFirst({
      where: {
        id: evidenceId,
        activity: { userId },
      },
      select: { id: true },
    });

    if (!evidence) {
      throw new NotFoundException('Comprovante nao encontrado.');
    }

    await this.db.activityEvidence.delete({ where: { id: evidenceId } });

    return { id: evidenceId };
  }

  estimateScore(dto: EstimateActivityScoreDto): {
    baseCategory: number;
    workloadFactor: number;
    totalImpact: number;
    progressPercentage: number;
  } {
    const baseCategory = this.baseScoreForCategory(dto.category);
    const workloadFactor = Math.max(
      0,
      Number((dto.workloadHours * 0.0625).toFixed(1)),
    );
    const totalImpact = Number((baseCategory + workloadFactor).toFixed(1));
    const progressPercentage = Math.min(
      100,
      Math.round((totalImpact / 150) * 100),
    );

    return {
      baseCategory,
      workloadFactor,
      totalImpact,
      progressPercentage,
    };
  }

  private async findOwnedActivity(
    userId: string,
    id: string,
  ): Promise<{
    id: string;
    title: string;
    description: string;
    category: string;
    workloadHours: number;
    score: Prisma.Decimal | number | string;
    status: string;
    term: string | null;
    kind: string | null;
  }> {
    const activity = await this.db.activity.findFirst({
      where: { id, userId },
    });

    if (!activity) {
      throw new NotFoundException('Atividade nao encontrada.');
    }

    return activity;
  }

  private validateEvidenceFile(file: UploadedEvidenceFile | undefined): void {
    if (!file) {
      throw new BadRequestException('Envie um arquivo de comprovante valido.');
    }

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.mimetype) || file.size > maxSize) {
      throw new BadRequestException(
        'Selecione arquivos PDF, PNG ou JPG com até 10MB.',
      );
    }
  }

  private baseScoreForCategory(category: string): number {
    switch (category) {
      case 'TEACHING':
        return 10;
      case 'RESEARCH':
        return 15;
      case 'OUTREACH':
        return 12;
      case 'MANAGEMENT':
        return 8;
      default:
        return 0;
    }
  }

  private toListItem(activity: {
    id: string;
    title: string;
    description: string;
    category: string;
    workloadHours: number;
    score: Prisma.Decimal | number | string;
    status: string;
    term: string | null;
    kind: string | null;
  }): ActivityListItemDto {
    return {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      category: activity.category as ActivityListItemDto['category'],
      workloadHours: activity.workloadHours,
      score: Number(activity.score),
      status: activity.status as ActivityListItemDto['status'],
      term: activity.term ?? '',
      kind: activity.kind ?? '',
    };
  }

  private toEvidenceUploadResponse(evidence: ActivityEvidenceRecord): {
    id: string;
    filename: string;
    originalName: string;
    size: number;
    url?: string;
  } {
    return {
      id: evidence.id,
      filename: evidence.filename ?? evidence.originalName ?? evidence.id,
      originalName: evidence.originalName ?? evidence.filename ?? evidence.id,
      size: evidence.sizeBytes ?? 0,
      url: evidence.externalUrl ?? undefined,
    };
  }

  private readonly mockActivities: readonly ActivityListItemDto[] = [
    {
      id: 'atv-teaching-1',
      title: 'Estruturas de Dados II (COMP0342)',
      description: 'Graduacao — 60 h teoricas / 30 h praticas',
      category: 'TEACHING',
      workloadHours: 90,
      score: 30,
      status: 'APPROVED',
      term: '2024.1',
      kind: 'Disciplina de graduacao',
    },
    {
      id: 'atv-teaching-2',
      title: 'Topicos avancados em IA (POS504)',
      description: 'Pos-graduacao — 45 h',
      category: 'TEACHING',
      workloadHours: 45,
      score: 20,
      status: 'APPROVED',
      term: '2024.1',
      kind: 'Disciplina de pos-graduacao',
    },
    {
      id: 'atv-research-1',
      title: 'Publicacao em periodico A1 — Nature Machine Intelligence',
      description: 'Artigo principal publicado em 2024',
      category: 'RESEARCH',
      workloadHours: 120,
      score: 45,
      status: 'APPROVED',
      term: '2024',
      kind: 'Publicacao Qualis A1',
    },
    {
      id: 'atv-research-2',
      title: 'Orientacao de doutorado concluida',
      description: 'Defesa aprovada no programa de Computacao',
      category: 'RESEARCH',
      workloadHours: 80,
      score: 25,
      status: 'APPROVED',
      term: '2024',
      kind: 'Orientacao',
    },
    {
      id: 'atv-outreach-1',
      title: 'Projeto de extensao em inclusao digital',
      description: 'Atuacao em comunidade com cursos de programacao',
      category: 'OUTREACH',
      workloadHours: 60,
      score: 18,
      status: 'APPROVED',
      term: '2024',
      kind: 'Projeto de extensao',
    },
    {
      id: 'atv-management-1',
      title: 'Coordenacao academica de curso',
      description: 'Gestao de grade e planejamento academico',
      category: 'MANAGEMENT',
      workloadHours: 120,
      score: 40,
      status: 'APPROVED',
      term: '2024',
      kind: 'Gestao academica',
    },
    {
      id: 'atv-pending-1',
      title: 'Banca de mestrado',
      description: 'Participacao em banca aguardando validacao',
      category: 'RESEARCH',
      workloadHours: 12,
      score: 8,
      status: 'PENDING',
      term: '2024',
      kind: 'Banca',
    },
    {
      id: 'atv-rejected-1',
      title: 'Evento sem comprovacao completa',
      description: 'Atividade com documentacao insuficiente',
      category: 'OUTREACH',
      workloadHours: 10,
      score: 3,
      status: 'REJECTED',
      term: '2024',
      kind: 'Evento',
    },
  ];
}
