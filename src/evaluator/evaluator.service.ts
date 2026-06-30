import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityCategory,
  ActivityStatus,
  ChecklistItemStatus,
  NotificationTone,
  Prisma,
  Role as PrismaRole,
} from '@prisma/client';
import { Role } from '../common/enums/role.enum';
import { ActivitiesService } from '../activities/activities.service';
import { CeilingService } from '../barema/ceiling.service';
import { ActivityListItemDto } from '../activities/dto/list-activities.dto';
import { ActivityDetailDto } from '../activities/dto/activity-detail.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ListEvaluatorActivitiesQueryDto } from './dto/list-evaluator-activities-query.dto';
import { PaginatedEvaluatorActivitiesResponseDto } from './dto/paginated-evaluator-activities-response.dto';
import { RejectActivityDto } from './dto/reject-activity.dto';
import {
  ListEvaluatorChecklistQueryDto,
  RejectChecklistItemDto,
} from './dto/evaluator-checklist.dto';
import { EvaluatorActivityDetailDto } from './dto/evaluator-activity-detail.dto';

@Injectable()
export class EvaluatorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activitiesService: ActivitiesService,
    private readonly ceilingService: CeilingService,
  ) {}

  async findAllPaginated(
    evaluatorId: string,
    query: ListEvaluatorActivitiesQueryDto,
  ): Promise<PaginatedEvaluatorActivitiesResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where = await this.buildWhere(evaluatorId, query);

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
            },
          },
        },
      }),
      this.prisma.activity.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return {
      items: activities.map((activity) => this.toQueueItem(activity)),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async findById(
    evaluatorId: string,
    activityId: string,
  ): Promise<EvaluatorActivityDetailDto> {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            university: true,
            careerClass: true,
            currentLevel: true,
          },
        },
        evidences: { orderBy: { createdAt: 'desc' } },
        statusHistory: {
          orderBy: { changedAt: 'desc' },
          include: { changedBy: { select: { name: true } } },
        },
        changeLogs: {
          orderBy: { changedAt: 'desc' },
          include: { changedBy: { select: { name: true } } },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException('Atividade nao encontrada.');
    }

    await this.assertAssignedTeacher(activity.userId, evaluatorId);
    this.assertNotSelfReview(activity.userId, evaluatorId);

    return {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      category: activity.category as ActivityListItemDto['category'],
      workloadHours: Number(activity.workloadHours),
      score: Number(activity.score),
      status: this.normalizeStatus(activity.status),
      term: activity.term ?? '',
      kind: activity.kind ?? '',
      rejectionReason: activity.rejectionReason,
      submittedAt: activity.submittedAt?.toISOString() ?? null,
      reviewedAt: activity.reviewedAt?.toISOString() ?? null,
      teacher: {
        id: activity.user.id,
        name: activity.user.name,
        email: activity.user.email,
        department: activity.user.department,
        university: activity.user.university,
        careerClass: activity.user.careerClass,
        currentLevel: activity.user.currentLevel,
      },
      evidences: activity.evidences.map((evidence) => ({
        id: evidence.id,
        originalName: evidence.originalName ?? evidence.filename ?? 'Comprovante',
        mimeType: evidence.mimeType,
        sizeBytes: evidence.sizeBytes ?? 0,
        createdAt: evidence.createdAt.toISOString(),
      })),
      statusHistory: activity.statusHistory.map((entry) => ({
        id: entry.id,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        note: entry.note,
        changedAt: entry.changedAt.toISOString(),
        changedByName: entry.changedBy?.name ?? null,
      })),
      changeLogs: activity.changeLogs.map((entry) => ({
        id: entry.id,
        field: entry.field,
        fieldLabel: entry.fieldLabel,
        oldValue: entry.oldValue,
        newValue: entry.newValue,
        changedAt: entry.changedAt.toISOString(),
        changedByName: entry.changedBy?.name ?? null,
      })),
    };
  }

  async approve(
    evaluatorId: string,
    activityId: string,
  ): Promise<ActivityDetailDto> {
    const activity = await this.getPendingActivity(activityId);
    this.assertNotSelfReview(activity.userId, evaluatorId);
    await this.assertAssignedTeacher(activity.userId, evaluatorId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.activity.update({
        where: { id: activityId },
        data: {
          status: ActivityStatus.APPROVED,
          reviewedAt: new Date(),
          reviewerId: evaluatorId,
          rejectionReason: null,
        },
        include: { evidences: { orderBy: { createdAt: 'desc' } } },
      });

      await tx.activityStatusHistory.create({
        data: {
          activityId,
          fromStatus: ActivityStatus.PENDING,
          toStatus: ActivityStatus.APPROVED,
          note: 'Atividade aprovada pelo revisor.',
          changedById: evaluatorId,
        },
      });

      await tx.notification.create({
        data: {
          userId: activity.userId,
          title: 'Atividade aprovada',
          message: `Sua atividade "${activity.title}" foi aprovada.`,
          icon: 'check_circle',
          tone: NotificationTone.SUCCESS,
        },
      });

      return result;
    });

    await this.ceilingService.checkAndNotifyAfterApproval(
      activity.userId,
      activity.progressionCycleId,
      activity.category,
    );

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      category: updated.category as ActivityListItemDto['category'],
      workloadHours: Number(updated.workloadHours),
      score: Number(updated.score),
      status: 'APPROVED',
      term: updated.term ?? '',
      kind: updated.kind ?? '',
      rejectionReason: null,
      submittedAt: updated.submittedAt?.toISOString() ?? null,
      evidences: updated.evidences.map((e) => ({
        id: e.id,
        originalName: e.originalName ?? e.filename ?? 'Comprovante',
        mimeType: e.mimeType,
        sizeBytes: e.sizeBytes ?? 0,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }

  async reject(
    evaluatorId: string,
    activityId: string,
    dto: RejectActivityDto,
  ): Promise<ActivityDetailDto> {
    const activity = await this.getPendingActivity(activityId);
    this.assertNotSelfReview(activity.userId, evaluatorId);
    await this.assertAssignedTeacher(activity.userId, evaluatorId);

    const reason = dto.rejectionReason.trim();
    if (!reason) {
      throw new BadRequestException('Informe o motivo da rejeicao.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.activity.update({
        where: { id: activityId },
        data: {
          status: ActivityStatus.REJECTED,
          reviewedAt: new Date(),
          reviewerId: evaluatorId,
          rejectionReason: reason,
        },
        include: { evidences: { orderBy: { createdAt: 'desc' } } },
      });

      await tx.activityStatusHistory.create({
        data: {
          activityId,
          fromStatus: ActivityStatus.PENDING,
          toStatus: ActivityStatus.REJECTED,
          note: reason,
          changedById: evaluatorId,
        },
      });

      await tx.notification.create({
        data: {
          userId: activity.userId,
          title: 'Atividade rejeitada',
          message: `Sua atividade "${activity.title}" foi rejeitada: ${reason}`,
          icon: 'error',
          tone: NotificationTone.ERROR,
        },
      });

      return result;
    });

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      category: updated.category as ActivityListItemDto['category'],
      workloadHours: Number(updated.workloadHours),
      score: Number(updated.score),
      status: 'REJECTED',
      term: updated.term ?? '',
      kind: updated.kind ?? '',
      rejectionReason: updated.rejectionReason,
      submittedAt: updated.submittedAt?.toISOString() ?? null,
      evidences: updated.evidences.map((e) => ({
        id: e.id,
        originalName: e.originalName ?? e.filename ?? 'Comprovante',
        mimeType: e.mimeType,
        sizeBytes: e.sizeBytes ?? 0,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }

  async getEvidenceFileForEvaluator(
    evaluatorId: string,
    evidenceId: string,
  ): Promise<{
    absolutePath: string;
    originalName: string;
    mimeType: string;
  }> {
    const evidence = await this.prisma.activityEvidence.findUnique({
      where: { id: evidenceId },
      include: { activity: { select: { userId: true } } },
    });

    if (!evidence) {
      throw new NotFoundException('Comprovante nao encontrado.');
    }

    this.assertNotSelfReview(evidence.activity.userId, evaluatorId);
    await this.assertAssignedTeacher(evidence.activity.userId, evaluatorId);

    return this.activitiesService.getEvidenceFile(evaluatorId, evidenceId, {
      allowEvaluatorAccess: true,
    });
  }

  async findChecklistItems(
    evaluatorId: string,
    query: ListEvaluatorChecklistQueryDto,
  ) {
    const teacherIds = await this.getAssignedTeacherIds(evaluatorId);
    if (teacherIds.length === 0) {
      return [];
    }

    if (query.teacherId && !teacherIds.includes(query.teacherId)) {
      return [];
    }

    const statuses = query.status
      ? [query.status]
      : [ChecklistItemStatus.PENDING, ChecklistItemStatus.ATTENTION];

    const items = await this.prisma.userChecklistItem.findMany({
      where: {
        userId: query.teacherId ?? { in: teacherIds },
        status: { in: statuses },
      },
      orderBy: { submittedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, department: true } },
        templateItem: { select: { id: true, title: true, description: true, category: true } },
      },
    });

    return items.map((item) => ({
      id: item.id,
      status: item.status,
      note: item.note,
      submittedAt: item.submittedAt?.toISOString() ?? null,
      teacher: item.user,
      template: item.templateItem,
    }));
  }

  async findChecklistItemById(evaluatorId: string, itemId: string) {
    const item = await this.prisma.userChecklistItem.findUnique({
      where: { id: itemId },
      include: {
        user: { select: { id: true, name: true, email: true, department: true } },
        templateItem: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Item de checklist nao encontrado.');
    }

    await this.assertAssignedTeacher(item.userId, evaluatorId);

    return {
      id: item.id,
      status: item.status,
      note: item.note,
      submittedAt: item.submittedAt?.toISOString() ?? null,
      reviewedAt: item.reviewedAt?.toISOString() ?? null,
      teacher: item.user,
      template: item.templateItem,
    };
  }

  async approveChecklistItem(evaluatorId: string, itemId: string) {
    const item = await this.getReviewableChecklistItem(itemId, evaluatorId);

    const updated = await this.prisma.userChecklistItem.update({
      where: { id: itemId },
      data: {
        status: ChecklistItemStatus.COMPLETED,
        reviewedAt: new Date(),
        reviewerId: evaluatorId,
        note: null,
      },
      include: {
        templateItem: { select: { title: true } },
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: item.userId,
        title: 'Checklist aprovado',
        message: `O item "${updated.templateItem.title}" foi aprovado pelo revisor.`,
        icon: 'check_circle',
        tone: NotificationTone.SUCCESS,
      },
    });

    return { id: updated.id, status: updated.status };
  }

  async rejectChecklistItem(
    evaluatorId: string,
    itemId: string,
    dto: RejectChecklistItemDto,
  ) {
    const item = await this.getReviewableChecklistItem(itemId, evaluatorId);

    const updated = await this.prisma.userChecklistItem.update({
      where: { id: itemId },
      data: {
        status: ChecklistItemStatus.ATTENTION,
        reviewedAt: new Date(),
        reviewerId: evaluatorId,
        note: dto.note.trim(),
      },
      include: {
        templateItem: { select: { title: true } },
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: item.userId,
        title: 'Checklist requer atencao',
        message: `O item "${updated.templateItem.title}" precisa de ajustes: ${dto.note.trim()}`,
        icon: 'error',
        tone: NotificationTone.ERROR,
      },
    });

    return { id: updated.id, status: updated.status, note: updated.note };
  }

  private async getReviewableChecklistItem(itemId: string, evaluatorId: string) {
    const item = await this.prisma.userChecklistItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Item de checklist nao encontrado.');
    }

    if (
      item.status !== ChecklistItemStatus.PENDING &&
      item.status !== ChecklistItemStatus.ATTENTION
    ) {
      throw new BadRequestException('Este item nao esta pendente de revisao.');
    }

    await this.assertAssignedTeacher(item.userId, evaluatorId);
    return item;
  }

  private async buildWhere(
    evaluatorId: string,
    query: ListEvaluatorActivitiesQueryDto,
  ): Promise<Prisma.ActivityWhereInput> {
    const assignedTeacherIds = await this.getAssignedTeacherIds(evaluatorId);

    const where: Prisma.ActivityWhereInput = {
      status: (query.status as ActivityStatus) ?? ActivityStatus.PENDING,
      userId: { in: assignedTeacherIds },
    };

    if (query.category) {
      where.category = query.category as ActivityCategory;
    }

    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return where;
  }

  private async getAssignedTeacherIds(evaluatorId: string): Promise<string[]> {
    const assignments = await this.prisma.evaluatorAssignment.findMany({
      where: { evaluatorId },
      select: { teacherId: true },
    });

    return assignments.map((assignment) => assignment.teacherId);
  }

  private async assertAssignedTeacher(
    teacherId: string,
    evaluatorId: string,
  ): Promise<void> {
    const assignment = await this.prisma.evaluatorAssignment.findUnique({
      where: { teacherId },
    });

    if (!assignment || assignment.evaluatorId !== evaluatorId) {
      throw new ForbiddenException(
        'Voce nao pode avaliar atividades deste docente.',
      );
    }
  }

  private async getPendingActivity(activityId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Atividade nao encontrada.');
    }

    if (activity.status !== ActivityStatus.PENDING) {
      throw new BadRequestException(
        'Somente atividades pendentes podem ser avaliadas.',
      );
    }

    return activity;
  }

  private assertNotSelfReview(teacherId: string, evaluatorId: string): void {
    if (teacherId === evaluatorId) {
      throw new ForbiddenException(
        'Voce nao pode avaliar suas proprias atividades.',
      );
    }
  }

  private toQueueItem(activity: {
    id: string;
    title: string;
    description: string;
    category: ActivityCategory;
    workloadHours: Prisma.Decimal;
    score: Prisma.Decimal;
    status: ActivityStatus;
    term: string | null;
    kind: string | null;
    rejectionReason: string | null;
    submittedAt: Date | null;
    user: {
      id: string;
      name: string;
      email: string;
      department: string | null;
    };
  }) {
    return {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      category: activity.category,
      workloadHours: Number(activity.workloadHours),
      score: Number(activity.score),
      status: this.normalizeStatus(activity.status),
      term: activity.term ?? '',
      kind: activity.kind ?? '',
      rejectionReason: activity.rejectionReason,
      submittedAt: activity.submittedAt?.toISOString() ?? null,
      teacher: {
        id: activity.user.id,
        name: activity.user.name,
        email: activity.user.email,
        department: activity.user.department,
      },
    };
  }

  private normalizeStatus(
    status: ActivityStatus,
  ): ActivityListItemDto['status'] {
    switch (status) {
      case ActivityStatus.APPROVED:
      case ActivityStatus.PENDING:
      case ActivityStatus.REJECTED:
        return status;
      default:
        return 'PENDING';
    }
  }
}
