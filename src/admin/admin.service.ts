import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role as PrismaRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { PublicUser } from '../common/types/public-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { UserOnboardingService } from '../users/user-onboarding.service';
import { AdminUserListItemDto } from './dto/admin-user-list-item.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ListAdminUsersQueryDto } from './dto/list-admin-users-query.dto';
import { PaginatedAdminUsersResponseDto } from './dto/paginated-admin-users-response.dto';
import { UpdateAdminUserRolesDto } from './dto/update-admin-user-roles.dto';
import {
  AssignEvaluatorDto,
  ListEvaluatorAssignmentsQueryDto,
} from './dto/evaluator-assignment.dto';
import {
  EvaluatorAssignmentListItemDto,
  PaginatedEvaluatorAssignmentsResponseDto,
} from './dto/evaluator-assignment-response.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userOnboarding: UserOnboardingService,
  ) {}

  async findAllPaginated(
    query: ListAdminUsersQueryDto,
  ): Promise<PaginatedAdminUsersResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where = this.buildWhere(query);

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          roles: true,
          department: true,
          university: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return {
      items: users.map((user) => this.toListItem(user)),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async findById(id: string): Promise<AdminUserListItemDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        department: true,
        university: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    return this.toListItem(user);
  }

  async createUser(dto: CreateAdminUserDto): Promise<PublicUser> {
    if (dto.roles.includes(Role.ADMIN)) {
      throw new BadRequestException(
        'Criacao de administradores via painel nao permitida.',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email ja cadastrado.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const lastProgressionDate = dto.lastProgressionDate
      ? new Date(dto.lastProgressionDate)
      : null;

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email.trim().toLowerCase(),
          name: dto.name.trim(),
          passwordHash,
          roles: dto.roles as PrismaRole[],
          university: dto.university?.trim() || null,
          department: dto.department?.trim() || null,
          careerClass: dto.careerClass?.trim() || null,
          currentLevel: dto.currentLevel?.trim() || null,
          lastProgressionDate,
          acceptTerms: true,
          acceptLgpd: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          roles: true,
          lattesUrl: true,
          orcid: true,
          createdAt: true,
          updatedAt: true,
          careerClass: true,
          currentLevel: true,
          university: true,
          department: true,
        },
      });

      if (dto.roles.includes(Role.USER)) {
        await this.userOnboarding.bootstrapForUser(
          created.id,
          lastProgressionDate,
          tx,
        );
      }

      return created;
    });

    return this.toPublicUser(user);
  }

  async updateRoles(
    adminId: string,
    userId: string,
    dto: UpdateAdminUserRolesDto,
  ): Promise<AdminUserListItemDto> {
    if (adminId === userId && !dto.roles.includes(Role.ADMIN)) {
      throw new ForbiddenException(
        'Voce nao pode remover seu proprio papel de administrador.',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    const hadUser = existing.roles.includes(PrismaRole.USER);
    const willHaveUser = dto.roles.includes(Role.USER);

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { roles: dto.roles as PrismaRole[] },
        select: {
          id: true,
          name: true,
          email: true,
          roles: true,
          department: true,
          university: true,
          createdAt: true,
        },
      });

      if (!hadUser && willHaveUser) {
        await this.userOnboarding.bootstrapForUser(
          userId,
          existing.lastProgressionDate,
          tx,
        );
      }

      return user;
    });

    return this.toListItem(updated);
  }

  async findAllAssignmentsPaginated(
    query: ListEvaluatorAssignmentsQueryDto,
  ): Promise<PaginatedEvaluatorAssignmentsResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    if (query.unassignedOnly) {
      return this.findUnassignedTeachersPaginated(page, pageSize, query.search);
    }

    const where: Prisma.UserWhereInput = {
      roles: { has: PrismaRole.USER },
    };

    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query.evaluatorId) {
      where.evaluatorAssignment = { evaluatorId: query.evaluatorId };
    }

    const [teachers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          evaluatorAssignment: {
            include: {
              evaluator: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: teachers.map((teacher) => this.toAssignmentListItem(teacher)),
      total,
      page,
      pageSize,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
    };
  }

  async assignEvaluator(
    adminId: string,
    teacherId: string,
    dto: AssignEvaluatorDto,
  ): Promise<EvaluatorAssignmentListItemDto> {
    if (teacherId === dto.evaluatorId) {
      throw new BadRequestException(
        'Um revisor nao pode ser atribuido as proprias atividades.',
      );
    }

    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (!teacher || !teacher.roles.includes(PrismaRole.USER)) {
      throw new NotFoundException('Docente nao encontrado.');
    }

    const evaluator = await this.prisma.user.findUnique({
      where: { id: dto.evaluatorId },
    });

    if (!evaluator || !evaluator.roles.includes(PrismaRole.EVALUATOR)) {
      throw new NotFoundException('Revisor nao encontrado.');
    }

    const assignment = await this.prisma.evaluatorAssignment.upsert({
      where: { teacherId },
      update: {
        evaluatorId: dto.evaluatorId,
        assignedById: adminId,
      },
      create: {
        teacherId,
        evaluatorId: dto.evaluatorId,
        assignedById: adminId,
      },
      include: {
        teacher: { select: { id: true, name: true, email: true, department: true } },
        evaluator: { select: { id: true, name: true, email: true } },
      },
    });

    return this.toAssignmentListItem({
      id: assignment.teacher.id,
      name: assignment.teacher.name,
      email: assignment.teacher.email,
      department: assignment.teacher.department,
      evaluatorAssignment: {
        updatedAt: assignment.updatedAt,
        evaluator: assignment.evaluator,
      },
    });
  }

  async unassignEvaluator(teacherId: string): Promise<EvaluatorAssignmentListItemDto> {
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        roles: true,
        evaluatorAssignment: {
          include: {
            evaluator: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!teacher || !teacher.roles.includes(PrismaRole.USER)) {
      throw new NotFoundException('Docente nao encontrado.');
    }

    if (teacher.evaluatorAssignment) {
      await this.prisma.evaluatorAssignment.delete({
        where: { teacherId },
      });
    }

    return this.toAssignmentListItem({
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      department: teacher.department,
      evaluatorAssignment: null,
    });
  }

  private async findUnassignedTeachersPaginated(
    page: number,
    pageSize: number,
    search?: string,
  ): Promise<PaginatedEvaluatorAssignmentsResponseDto> {
    const where: Prisma.UserWhereInput = {
      roles: { has: PrismaRole.USER },
      evaluatorAssignment: null,
    };

    const trimmedSearch = search?.trim();
    if (trimmedSearch) {
      where.OR = [
        { name: { contains: trimmedSearch, mode: 'insensitive' } },
        { email: { contains: trimmedSearch, mode: 'insensitive' } },
      ];
    }

    const [teachers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: teachers.map((teacher) =>
        this.toAssignmentListItem({ ...teacher, evaluatorAssignment: null }),
      ),
      total,
      page,
      pageSize,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
    };
  }

  private toAssignmentListItem(teacher: {
    id: string;
    name: string;
    email: string;
    department: string | null;
    evaluatorAssignment?: {
      updatedAt?: Date;
      evaluator: { id: string; name: string; email: string };
    } | null;
  }): EvaluatorAssignmentListItemDto {
    return {
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
      },
      evaluator: teacher.evaluatorAssignment?.evaluator
        ? {
            id: teacher.evaluatorAssignment.evaluator.id,
            name: teacher.evaluatorAssignment.evaluator.name,
            email: teacher.evaluatorAssignment.evaluator.email,
          }
        : null,
      assignedAt: teacher.evaluatorAssignment?.updatedAt?.toISOString() ?? null,
    };
  }

  private buildWhere(query: ListAdminUsersQueryDto): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (query.role) {
      where.roles = { has: query.role as PrismaRole };
    }

    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private toListItem(user: {
    id: string;
    name: string;
    email: string;
    roles: PrismaRole[];
    department: string | null;
    university: string | null;
    createdAt: Date;
  }): AdminUserListItemDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles as Role[],
      department: user.department,
      university: user.university,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    name: string;
    roles: PrismaRole[];
    lattesUrl: string | null;
    orcid: string | null;
    createdAt: Date;
    updatedAt: Date;
    careerClass: string | null;
    currentLevel: string | null;
    university: string | null;
    department: string | null;
  }): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles as Role[],
      lattesUrl: user.lattesUrl,
      orcid: user.orcid,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      careerClass: user.careerClass,
      currentLevel: user.currentLevel,
      university: user.university,
      department: user.department,
    };
  }
}
