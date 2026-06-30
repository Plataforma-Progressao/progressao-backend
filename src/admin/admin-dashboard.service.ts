import { Injectable } from '@nestjs/common';
import { ActivityStatus, Role as PrismaRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminDashboardHomeDto } from './dto/admin-dashboard-home.dto';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getHome(adminId: string): Promise<AdminDashboardHomeDto> {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { name: true },
    });

    const [
      teachers,
      evaluators,
      admins,
      assignments,
      unassignedTeachers,
      orphanPendingCount,
      recentAssignments,
    ] = await Promise.all([
      this.prisma.user.count({ where: { roles: { has: PrismaRole.USER } } }),
      this.prisma.user.count({ where: { roles: { has: PrismaRole.EVALUATOR } } }),
      this.prisma.user.count({ where: { roles: { has: PrismaRole.ADMIN } } }),
      this.prisma.evaluatorAssignment.findMany({
        include: {
          teacher: { select: { id: true, name: true, email: true, department: true } },
          evaluator: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.user.findMany({
        where: {
          roles: { has: PrismaRole.USER },
          evaluatorAssignment: null,
        },
        select: { id: true, name: true, email: true, department: true },
        orderBy: { name: 'asc' },
        take: 10,
      }),
      this.countOrphanPendingActivities(),
      this.prisma.evaluatorAssignment.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          teacher: { select: { name: true, email: true } },
          evaluator: { select: { name: true } },
        },
      }),
    ]);

    const evaluatorLoads = await this.buildEvaluatorLoads(assignments);

    const unassignedTeacherCount = await this.prisma.user.count({
      where: {
        roles: { has: PrismaRole.USER },
        evaluatorAssignment: null,
      },
    });

    return {
      displayName: admin?.name ?? 'Administrador',
      summary:
        'Visão geral da plataforma: usuários, atribuições revisor-docente e pendências.',
      userCounts: {
        teachers,
        evaluators,
        admins,
      },
      unassignedTeacherCount,
      unassignedTeachers: unassignedTeachers.map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
      })),
      orphanPendingActivityCount: orphanPendingCount,
      evaluatorLoads,
      recentAssignments: recentAssignments.map((assignment) => ({
        teacherName: assignment.teacher.name,
        teacherEmail: assignment.teacher.email,
        evaluatorName: assignment.evaluator.name,
        assignedAt: assignment.updatedAt.toISOString(),
      })),
    };
  }

  private async countOrphanPendingActivities(): Promise<number> {
    const unassignedTeacherIds = await this.prisma.user.findMany({
      where: {
        roles: { has: PrismaRole.USER },
        evaluatorAssignment: null,
      },
      select: { id: true },
    });

    if (unassignedTeacherIds.length === 0) {
      return 0;
    }

    return this.prisma.activity.count({
      where: {
        status: ActivityStatus.PENDING,
        userId: { in: unassignedTeacherIds.map((t) => t.id) },
      },
    });
  }

  private async buildEvaluatorLoads(
    assignments: Array<{
      evaluatorId: string;
      evaluator: { id: string; name: string; email: string };
      teacherId: string;
    }>,
  ) {
    const loadMap = new Map<
      string,
      { evaluatorId: string; evaluatorName: string; evaluatorEmail: string; teacherIds: string[] }
    >();

    for (const assignment of assignments) {
      const existing = loadMap.get(assignment.evaluatorId);
      if (existing) {
        existing.teacherIds.push(assignment.teacherId);
      } else {
        loadMap.set(assignment.evaluatorId, {
          evaluatorId: assignment.evaluator.id,
          evaluatorName: assignment.evaluator.name,
          evaluatorEmail: assignment.evaluator.email,
          teacherIds: [assignment.teacherId],
        });
      }
    }

    const loads = await Promise.all(
      [...loadMap.values()].map(async (load) => {
        const pendingCount =
          load.teacherIds.length === 0
            ? 0
            : await this.prisma.activity.count({
                where: {
                  status: ActivityStatus.PENDING,
                  userId: { in: load.teacherIds },
                },
              });

        return {
          evaluatorId: load.evaluatorId,
          evaluatorName: load.evaluatorName,
          evaluatorEmail: load.evaluatorEmail,
          teacherCount: load.teacherIds.length,
          pendingCount,
        };
      }),
    );

    return loads.sort((a, b) => b.pendingCount - a.pendingCount);
  }
}
