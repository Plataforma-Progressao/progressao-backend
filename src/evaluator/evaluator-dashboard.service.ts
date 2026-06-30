import { Injectable } from '@nestjs/common';
import { ActivityCategory, ActivityStatus, ChecklistItemStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EvaluatorDashboardHomeDto } from './dto/evaluator-dashboard-home.dto';

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  TEACHING: 'Ensino',
  RESEARCH: 'Pesquisa',
  OUTREACH: 'Extensão',
  MANAGEMENT: 'Gestão',
};

@Injectable()
export class EvaluatorDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getHome(evaluatorId: string): Promise<EvaluatorDashboardHomeDto> {
    const evaluator = await this.prisma.user.findUnique({
      where: { id: evaluatorId },
      select: { name: true },
    });

    const assignments = await this.prisma.evaluatorAssignment.findMany({
      where: { evaluatorId },
      include: {
        teacher: {
          select: { id: true, name: true, email: true, department: true },
        },
      },
    });

    const teacherIds = assignments.map((a) => a.teacherId);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      pendingCount,
      pendingChecklistCount,
      approvedLast30Days,
      rejectedLast30Days,
      pendingActivities,
      teachersWithPending,
    ] = await Promise.all([
      teacherIds.length === 0
        ? 0
        : this.prisma.activity.count({
            where: {
              status: ActivityStatus.PENDING,
              userId: { in: teacherIds },
            },
          }),
      teacherIds.length === 0
        ? 0
        : this.prisma.userChecklistItem.count({
            where: {
              userId: { in: teacherIds },
              status: {
                in: [ChecklistItemStatus.PENDING, ChecklistItemStatus.ATTENTION],
              },
            },
          }),
      teacherIds.length === 0
        ? 0
        : this.prisma.activity.count({
            where: {
              status: ActivityStatus.APPROVED,
              reviewerId: evaluatorId,
              reviewedAt: { gte: thirtyDaysAgo },
            },
          }),
      teacherIds.length === 0
        ? 0
        : this.prisma.activity.count({
            where: {
              status: ActivityStatus.REJECTED,
              reviewerId: evaluatorId,
              reviewedAt: { gte: thirtyDaysAgo },
            },
          }),
      teacherIds.length === 0
        ? []
        : this.prisma.activity.findMany({
            where: {
              status: ActivityStatus.PENDING,
              userId: { in: teacherIds },
            },
            orderBy: { submittedAt: 'desc' },
            take: 5,
            include: {
              user: { select: { name: true } },
            },
          }),
      teacherIds.length === 0
        ? []
        : this.prisma.activity.groupBy({
            by: ['userId'],
            where: {
              status: ActivityStatus.PENDING,
              userId: { in: teacherIds },
            },
            _count: { id: true },
          }),
    ]);

    const pendingByTeacher = new Map(
      teachersWithPending.map((row) => [row.userId, row._count.id]),
    );

    const categoryBreakdown = await this.buildCategoryBreakdown(teacherIds);

    return {
      displayName: evaluator?.name ?? 'Revisor',
      summary: 'Acompanhe docentes atribuídos e atividades aguardando revisão.',
      summaryStats: {
        assignedTeacherCount: teacherIds.length,
        pendingCount,
        pendingChecklistCount,
        approvedLast30Days,
        rejectedLast30Days,
      },
      teachers: assignments.map((assignment) => ({
        id: assignment.teacher.id,
        name: assignment.teacher.name,
        email: assignment.teacher.email,
        department: assignment.teacher.department,
        pendingCount: pendingByTeacher.get(assignment.teacherId) ?? 0,
      })),
      pendingActivities: pendingActivities.map((activity) => ({
        id: activity.id,
        title: activity.title,
        teacherName: activity.user.name,
        category: activity.category,
        submittedAt: activity.submittedAt?.toISOString() ?? null,
      })),
      categoryBreakdown,
    };
  }

  private async buildCategoryBreakdown(teacherIds: string[]) {
    if (teacherIds.length === 0) {
      return Object.values(ActivityCategory).map((category) => ({
        category,
        label: CATEGORY_LABELS[category],
        pendingCount: 0,
      }));
    }

    const grouped = await this.prisma.activity.groupBy({
      by: ['category'],
      where: {
        status: ActivityStatus.PENDING,
        userId: { in: teacherIds },
      },
      _count: { id: true },
    });

    const countMap = new Map(grouped.map((row) => [row.category, row._count.id]));

    return Object.values(ActivityCategory).map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      pendingCount: countMap.get(category) ?? 0,
    }));
  }
}
