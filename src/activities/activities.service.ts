import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { existsSync, unlinkSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { BaremaService } from '../barema/barema.service';
import { ClassificationService } from '../barema/classification.service';
import { CeilingService } from '../barema/ceiling.service';
import { OptimizerService } from '../barema/optimizer.service';
import { ScoringEngineService } from '../barema/scoring-engine.service';
import { ActivityChangeLogListDto } from './dto/activity-change-log.dto';
import { ActivityDetailDto } from './dto/activity-detail.dto';
import { ActivityEvidenceDto } from './dto/activity-evidence.dto';
import {
  ActivityListItemDto,
  ListActivitiesResponseDto,
} from './dto/list-activities.dto';
import { ListActivitiesQueryDto } from './dto/list-activities-query.dto';
import { PaginatedActivitiesResponseDto } from './dto/paginated-activities-response.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { EstimateActivityScoreDto } from './dto/estimate-activity-score.dto';
import { ClassifyActivityDto, OptimizeClassificationDto } from './dto/classify-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { UploadedEvidenceFile } from './types/uploaded-evidence-file';
import { resolveEvidenceAbsolutePath } from './config/multer-storage';
import {
  creationChangeEntry,
  diffActivityFields,
  snapshotFromActivity,
} from './utils/activity-field-audit';

type ActivityRecord = {
  id: string;
  userId: string;
  progressionCycleId: string | null;
  title: string;
  description: string;
  category: string;
  workloadHours: Prisma.Decimal | number | string;
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
  progressionCycleId: string | null;
  title: string;
  description: string;
  category: string;
  workloadHours: Prisma.Decimal | number;
  score: Prisma.Decimal;
  term: string | null;
  kind: string | null;
  status: string;
  submittedAt: Date;
  reviewedAt: Date;
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

type ActivityListWhere = {
  userId: string;
  progressionCycleId?: string;
  category?: string;
  status?: string;
  term?: { startsWith: string };
  OR?: Array<
    | { title: { contains: string; mode: 'insensitive' } }
    | { description: { contains: string; mode: 'insensitive' } }
  >;
};

interface ActivitiesDatabase {
  activity: {
    findMany(args: {
      where: ActivityListWhere;
      orderBy: { createdAt: 'desc' };
      skip?: number;
      take?: number;
    }): Promise<ActivityRecord[]>;
    count(args: { where: ActivityListWhere }): Promise<number>;
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

type ActivityChangeLogDelegate = {
  findMany(args: unknown): Promise<
    {
      id: string;
      field: string;
      fieldLabel: string;
      oldValue: string | null;
      newValue: string | null;
      changedAt: Date;
      changedBy: { name: string } | null;
    }[]
  >;
  create(args: unknown): Promise<unknown>;
  createMany(args: unknown): Promise<unknown>;
};

type PrismaWithChangeLog = PrismaService & {
  activityChangeLog: ActivityChangeLogDelegate;
};

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringEngine: ScoringEngineService,
    private readonly baremaService: BaremaService,
    private readonly classificationService: ClassificationService,
    private readonly ceilingService: CeilingService,
    private readonly optimizerService: OptimizerService,
  ) {}

  private get prismaClient(): PrismaWithChangeLog {
    return this.prisma as PrismaWithChangeLog;
  }

  private get db(): ActivitiesDatabase {
    return this.prisma as unknown as ActivitiesDatabase;
  }

  async getRadReport(userId: string): Promise<ListActivitiesResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        siapeId: true,
        department: true,
        workRegime: true,
        university: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    const cycle =
      (await this.prisma.progressionCycle.findFirst({
        where: { userId, isActive: true },
        orderBy: { startsAt: 'desc' },
      })) ??
      (await this.prisma.progressionCycle.findFirst({
        where: { userId },
        orderBy: { startsAt: 'desc' },
      }));

    const activities = await this.findActivitiesForReport(userId, cycle?.id ?? null);

    return {
      userData: this.buildReportUserProfile(user),
      metadata: this.buildReportMetadata(user, cycle, activities),
      activities: activities.map((activity) => this.toListItem(activity)),
    };
  }

  async findAllPaginated(
    userId: string,
    query: ListActivitiesQueryDto,
  ): Promise<PaginatedActivitiesResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where = this.buildListWhere(userId, query);

    const [activities, total] = await Promise.all([
      this.db.activity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.activity.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return {
      items: activities.map((activity) => this.toListItem(activity)),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async findById(userId: string, id: string): Promise<ActivityDetailDto> {
    const activity = await this.findOwnedActivity(userId, id);
    const evidences = await this.prisma.activityEvidence.findMany({
      where: { activityId: id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ...this.toListItem(activity),
      evidences: evidences.map((evidence) => this.toEvidenceDto(evidence)),
    };
  }

  async findChanges(
    userId: string,
    activityId: string,
  ): Promise<ActivityChangeLogListDto> {
    await this.findOwnedActivity(userId, activityId);

    const rows = await this.prismaClient.activityChangeLog.findMany({
      where: { activityId },
      orderBy: { changedAt: 'desc' },
      include: {
        changedBy: { select: { name: true } },
      },
    });

    return {
      total: rows.length,
      items: rows.map((row) => ({
        id: row.id,
        field: row.field,
        fieldLabel: row.fieldLabel,
        oldValue: row.oldValue,
        newValue: row.newValue,
        changedAt: row.changedAt.toISOString(),
        changedByName: row.changedBy?.name ?? null,
      })),
    };
  }

  async create(
    userId: string,
    dto: CreateActivityDto,
  ): Promise<ActivityListItemDto> {
    const activeCycleId = await this.resolveActiveCycleId(userId);
    const created = creationChangeEntry();
    const { score } = await this.scoringEngine.estimateScore(
      dto.category,
      dto.workloadHours,
      dto.matchedRuleId,
    );

    const activity = await this.prisma.activity.create({
      data: {
        userId,
        progressionCycleId: activeCycleId,
        title: dto.title.trim(),
        description: dto.description.trim(),
        category: dto.category,
        workloadHours: new Prisma.Decimal(dto.workloadHours),
        score: new Prisma.Decimal(score),
        term: dto.term?.trim() || null,
        kind: dto.kind?.trim() || null,
        status: 'PENDING',
        submittedAt: new Date(),
        reviewedAt: null,
        reviewerId: null,
        rejectionReason: null,
      },
    });

    await this.prisma.activityStatusHistory.create({
      data: {
        activityId: activity.id,
        fromStatus: 'DRAFT',
        toStatus: 'PENDING',
        note: 'Atividade enviada para avaliacao.',
        changedById: userId,
      },
    });

    await this.prismaClient.activityChangeLog.create({
      data: {
        activityId: activity.id,
        field: created.field,
        fieldLabel: created.fieldLabel,
        oldValue: created.oldValue,
        newValue: created.newValue,
        changedById: userId,
      },
    });

    await this.ceilingService.checkProjectedCeilingOnCreate(
      userId,
      activeCycleId,
      dto.category,
      score,
    );

    return this.toListItem(activity);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateActivityDto,
  ): Promise<ActivityListItemDto> {
    const existing = await this.prisma.activity.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Atividade nao encontrada.');
    }

    const before = snapshotFromActivity(existing);

    const category = dto.category ?? existing.category;
    const workloadHours =
      dto.workloadHours === undefined
        ? Number(existing.workloadHours)
        : dto.workloadHours;
    const { score } = await this.scoringEngine.estimateScore(
      category as CreateActivityDto['category'],
      workloadHours,
      dto.matchedRuleId,
    );

    const merged = {
      title: dto.title?.trim() ?? existing.title,
      description: dto.description?.trim() ?? existing.description,
      category,
      workloadHours,
      score,
      term: dto.term === undefined ? existing.term : dto.term?.trim() || null,
      kind: dto.kind === undefined ? existing.kind : dto.kind?.trim() || null,
    };

    const after = snapshotFromActivity({
      ...existing,
      ...merged,
      workloadHours: merged.workloadHours,
      score: merged.score,
    });

    const changes = diffActivityFields(before, after);
    const needsReReview =
      changes.length > 0 &&
      (existing.status === 'APPROVED' || existing.status === 'REJECTED');

    const updateData: Prisma.ActivityUpdateInput = {
      title: merged.title,
      description: merged.description,
      category: merged.category,
      workloadHours: new Prisma.Decimal(merged.workloadHours),
      score: new Prisma.Decimal(merged.score),
      term: merged.term,
      kind: merged.kind,
    };

    if (needsReReview) {
      updateData.status = 'PENDING';
      updateData.submittedAt = new Date();
      updateData.reviewedAt = null;
      updateData.reviewer = { disconnect: true };
      updateData.rejectionReason = null;
    }

    const activity = await this.prisma.activity.update({
      where: { id },
      data: updateData,
    });

    if (needsReReview) {
      await this.prisma.activityStatusHistory.create({
        data: {
          activityId: id,
          fromStatus: existing.status as 'APPROVED' | 'REJECTED',
          toStatus: 'PENDING',
          note: 'Atividade reenviada para avaliacao apos edicao.',
          changedById: userId,
        },
      });
    }

    if (changes.length > 0) {
      await this.prismaClient.activityChangeLog.createMany({
        data: changes.map((change) => ({
          activityId: id,
          field: change.field,
          fieldLabel: change.fieldLabel,
          oldValue: change.oldValue,
          newValue: change.newValue,
          changedById: userId,
        })),
      });
    }

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
    const evidence = await this.prisma.activityEvidence.findFirst({
      where: {
        id: evidenceId,
        activity: { userId },
      },
    });

    if (!evidence) {
      throw new NotFoundException('Comprovante nao encontrado.');
    }

    this.removeEvidenceFile(evidence.storagePath);
    await this.prisma.activityEvidence.delete({ where: { id: evidenceId } });

    return { id: evidenceId };
  }

  async getEvidenceFile(
    userId: string,
    evidenceId: string,
    options?: { allowEvaluatorAccess?: boolean },
  ): Promise<{
    absolutePath: string;
    originalName: string;
    mimeType: string;
  }> {
    const evidence = await this.prisma.activityEvidence.findFirst({
      where: {
        id: evidenceId,
        ...(options?.allowEvaluatorAccess
          ? {}
          : { activity: { userId } }),
      },
      include: {
        activity: { select: { userId: true, status: true } },
      },
    });

    if (!evidence) {
      throw new NotFoundException('Comprovante nao encontrado.');
    }

    if (options?.allowEvaluatorAccess && evidence.activity.userId !== userId) {
      // Evaluator access is validated at controller level
    } else if (!options?.allowEvaluatorAccess && evidence.activity.userId !== userId) {
      throw new NotFoundException('Comprovante nao encontrado.');
    }

    const absolutePath = resolveEvidenceAbsolutePath(evidence.storagePath);

    if (!absolutePath || !existsSync(absolutePath)) {
      throw new NotFoundException(
        'Arquivo do comprovante indisponivel. Em producao, configure armazenamento em nuvem.',
      );
    }

    return {
      absolutePath,
      originalName: evidence.originalName ?? evidence.filename ?? 'comprovante',
      mimeType: evidence.mimeType ?? 'application/octet-stream',
    };
  }

  async estimateScore(dto: EstimateActivityScoreDto): Promise<{
    baseCategory: number;
    workloadFactor: number;
    totalImpact: number;
    progressPercentage: number;
    matchedRuleId: string | null;
  }> {
    const { score, matchedRuleId } = await this.scoringEngine.estimateScore(
      dto.category,
      dto.workloadHours,
      dto.matchedRuleId,
    );
    const config = await this.baremaService.getActiveConfig();
    const categoryRule = this.baremaService.getCategoryRule(config, dto.category);
    const baseCategory = Number(categoryRule.baseScore);
    const multiplier = Number(categoryRule.workloadMultiplier);
    const workloadFactor = Number((dto.workloadHours * multiplier).toFixed(1));
    const progressPercentage = Math.min(
      100,
      Math.round((score / 150) * 100),
    );

    return {
      baseCategory,
      workloadFactor,
      totalImpact: score,
      progressPercentage,
      matchedRuleId,
    };
  }

  async classify(dto: ClassifyActivityDto) {
    return this.classificationService.classify(dto);
  }

  async optimizeClassification(userId: string, dto: OptimizeClassificationDto) {
    const cycleId = await this.resolveActiveCycleId(userId);
    return this.optimizerService.optimize({
      ...dto,
      userId,
      cycleId,
    });
  }

  private buildListWhere(
    userId: string,
    query: ListActivitiesQueryDto,
  ): ActivityListWhere {
    const where: ActivityListWhere = { userId };

    if (query.category) {
      where.category = query.category;
    }

    if (query.status) {
      where.status = query.status;
    }

    const term = query.term?.trim();
    if (term) {
      where.term = { startsWith: term };
    }

    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async findOwnedActivity(
    userId: string,
    id: string,
  ): Promise<{
    id: string;
    title: string;
    description: string;
    category: string;
    workloadHours: Prisma.Decimal | number | string;
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

  private async findActivitiesForReport(
    userId: string,
    progressionCycleId: string | null,
  ): Promise<ActivityRecord[]> {
    if (progressionCycleId) {
      const cycleActivities = await this.db.activity.findMany({
        where: { userId, progressionCycleId },
        orderBy: { createdAt: 'desc' },
      });

      if (cycleActivities.length > 0) {
        return cycleActivities;
      }
    }

    return this.db.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private buildReportUserProfile(user: {
    id: string;
    name: string;
    siapeId: string | null;
    department: string | null;
    workRegime: string | null;
  }): ListActivitiesResponseDto['userData'] {
    return {
      id: user.id,
      name: user.name.trim(),
      siapeId: user.siapeId?.trim() || 'N/A',
      department: user.department?.trim() || 'Departamento nao informado',
      workRegime: this.formatWorkRegime(user.workRegime),
    };
  }

  private buildReportMetadata(
    user: { university: string | null },
    cycle: {
      label: string;
      startsAt: Date;
      endsAt: Date;
      statusLabel: string | null;
      issuedAtLabel: string | null;
    } | null,
    activities: readonly { status: string }[],
  ): ListActivitiesResponseDto['metadata'] {
    return {
      institution: this.formatInstitutionName(user.university),
      graduateOfficeTitle: 'PRO-REITORIA DE GRADUACAO E PESQUISA',
      documentLabel: this.resolveDocumentLabel(activities),
      cycleLabel: cycle ? this.formatCycleLabel(cycle) : 'Ciclo nao informado',
      issuedAtLabel: cycle?.issuedAtLabel?.trim() || this.formatDateLabel(new Date()),
      cycleStatus: this.resolveCycleStatus(cycle, activities),
    };
  }

  private formatInstitutionName(university: string | null): string {
    const value = university?.trim();
    return value && value.length > 0 ? value.toUpperCase() : 'INSTITUICAO NAO INFORMADA';
  }

  private formatWorkRegime(workRegime: string | null): string {
    if (!workRegime?.trim()) {
      return 'Regime nao informado';
    }

    const normalized = workRegime.trim().toUpperCase();
    switch (normalized) {
      case 'DE':
        return 'Dedicacao Exclusiva (DE)';
      case 'TC':
        return 'Tempo Integral (TC)';
      case 'TP':
        return 'Tempo Parcial (TP)';
      default:
        return workRegime.trim();
    }
  }

  private formatCycleLabel(cycle: {
    label: string;
    startsAt: Date;
    endsAt: Date;
  }): string {
    const label = cycle.label.trim();
    if (label.length > 0) {
      return label;
    }

    const startYear = cycle.startsAt.getFullYear();
    const endYear = cycle.endsAt.getFullYear();
    return `${startYear} - ${endYear}`;
  }

  private formatDateLabel(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  private resolveDocumentLabel(
    activities: readonly { status: string }[],
  ): string {
    if (activities.length === 0) {
      return 'DOCUMENTO PRELIMINAR';
    }

    const hasPending = activities.some(
      (activity) => activity.status === 'PENDING' || activity.status === 'DRAFT',
    );

    return hasPending ? 'DOCUMENTO PRELIMINAR' : 'DOCUMENTO CONSOLIDADO';
  }

  private resolveCycleStatus(
    cycle: { statusLabel: string | null } | null,
    activities: readonly { status: string }[],
  ): string {
    const cycleStatus = cycle?.statusLabel?.trim();
    if (cycleStatus) {
      return cycleStatus;
    }

    if (activities.length === 0) {
      return 'Sem atividades registradas';
    }

    if (activities.some((activity) => activity.status === 'REJECTED')) {
      return 'Com pendencias';
    }

    if (
      activities.some(
        (activity) => activity.status === 'PENDING' || activity.status === 'DRAFT',
      )
    ) {
      return 'Em revisao';
    }

    return 'Em conformidade';
  }

  private toListItem(activity: {
    id: string;
    title: string;
    description: string;
    category: string;
    workloadHours: Prisma.Decimal | number | string;
    score: Prisma.Decimal | number | string;
    status: string;
    term: string | null;
    kind: string | null;
    rejectionReason?: string | null;
    submittedAt?: Date | null;
  }): ActivityListItemDto {
    return {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      category: activity.category as ActivityListItemDto['category'],
      workloadHours: Number(activity.workloadHours),
      score: Number(activity.score),
      status: this.normalizeActivityStatus(activity.status),
      term: activity.term ?? '',
      kind: activity.kind ?? '',
      rejectionReason: activity.rejectionReason ?? null,
      submittedAt: activity.submittedAt?.toISOString() ?? null,
    };
  }

  private async resolveActiveCycleId(userId: string): Promise<string | null> {
    const cycle = await this.prisma.progressionCycle.findFirst({
      where: { userId, isActive: true },
      orderBy: { startsAt: 'desc' },
      select: { id: true },
    });

    return cycle?.id ?? null;
  }

  private removeEvidenceFile(storagePath: string | null): void {
    const absolutePath = resolveEvidenceAbsolutePath(storagePath);
    if (absolutePath && existsSync(absolutePath)) {
      unlinkSync(absolutePath);
    }
  }

  private toEvidenceDto(evidence: ActivityEvidenceRecord): ActivityEvidenceDto {
    return {
      id: evidence.id,
      originalName: evidence.originalName ?? evidence.filename ?? 'Comprovante',
      mimeType: evidence.mimeType,
      sizeBytes: evidence.sizeBytes ?? 0,
      createdAt: evidence.createdAt.toISOString(),
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

  private normalizeActivityStatus(status: string): ActivityListItemDto['status'] {
    switch (status) {
      case 'APPROVED':
      case 'PENDING':
      case 'REJECTED':
        return status;
      default:
        return 'PENDING';
    }
  }
}
