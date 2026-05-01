import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Role as PrismaRole, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { PublicUser } from '../common/types/public-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserInput } from '../common/interfaces/register-user-input.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  private readonly userPublicSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    lattesUrl: true,
    orcid: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.UserSelect;

  constructor(private readonly prisma: PrismaService) {}

  async findDashboardProfileById(id: string): Promise<{
    id: string;
    name: string;
    careerClass: string | null;
    currentLevel: string | null;
  } | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        careerClass: true,
        currentLevel: true,
      },
    });
  }

  async create(createUserDto: CreateUserDto): Promise<PublicUser> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email ja cadastrado.');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    let createdUser: {
      id: string;
      email: string;
      name: string;
      role: PrismaRole;
      lattesUrl: string | null;
      orcid: string | null;
      createdAt: Date;
      updatedAt: Date;
    };

    try {
      createdUser = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          name: createUserDto.name,
          passwordHash,
          role: PrismaRole.USER,
        },
        select: this.userPublicSelect,
      });
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Dados de cadastro ja utilizados.');
      }

      throw error;
    }

    return this.toPublicUser(createdUser);
  }

  async createFromRegistration(data: RegisterUserInput): Promise<PublicUser> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { cpf: data.cpf }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Dados de cadastro ja utilizados.');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    let createdUser: {
      id: string;
      email: string;
      name: string;
      role: PrismaRole;
      lattesUrl: string | null;
      orcid: string | null;
      createdAt: Date;
      updatedAt: Date;
    };

    try {
      createdUser = await this.prisma.user.create({
        data: {
          email: data.email,
          name: data.fullName,
          cpf: data.cpf,
          university: data.university,
          center: data.center,
          department: data.department,
          practiceAreas: data.practiceAreas,
          careerClass: data.careerClass,
          currentLevel: data.currentLevel,
          lastProgressionDate: data.lastProgressionDate,
          acceptTerms: data.acceptTerms,
          acceptLgpd: data.acceptLgpd,
          passwordHash,
          role: PrismaRole.USER,
        },
        select: this.userPublicSelect,
      });
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Dados de cadastro ja utilizados.');
      }

      throw error;
    }

    return this.toPublicUser(createdUser);
  }

  async findById(id: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userPublicSelect,
    });

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    return this.toPublicUser(user);
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByIdWithSensitiveFields(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async setRefreshTokenHash(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }

  async rotateRefreshTokenHash(
    userId: string,
    currentRefreshTokenHash: string,
    newRefreshTokenHash: string,
  ): Promise<boolean> {
    const result = await this.prisma.user.updateMany({
      where: {
        id: userId,
        refreshTokenHash: currentRefreshTokenHash,
      },
      data: {
        refreshTokenHash: newRefreshTokenHash,
      },
    });

    return result.count === 1;
  }

  async setResetPasswordToken(
    email: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpiresAt: expiresAt,
      },
    });
  }

  async findByResetPasswordTokenHash(tokenHash: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async clearResetPasswordToken(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        resetPasswordTokenHash: null,
        resetPasswordExpiresAt: null,
      },
    });
  }

  async updatePassword(userId: string, password: string): Promise<void> {
    const passwordHash = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        refreshTokenHash: null,
        resetPasswordTokenHash: null,
        resetPasswordExpiresAt: null,
      },
    });
  }

  async findAll(): Promise<PublicUser[]> {
    const users = await this.prisma.user.findMany({
      select: this.userPublicSelect,
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => this.toPublicUser(user));
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<PublicUser> {
    const trimmedLattes =
      dto.lattesUrl !== undefined ? dto.lattesUrl.trim() || null : undefined;
    const trimmedOrcid =
      dto.orcid !== undefined ? dto.orcid.trim() || null : undefined;

    const data: Prisma.UserUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (trimmedLattes !== undefined) {
      data.lattesUrl = trimmedLattes;
    }

    if (trimmedOrcid !== undefined) {
      data.orcid = trimmedOrcid;
    }

    const newPassword = dto.newPassword?.trim();
    if (newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Informe a senha atual para alterar a senha.');
      }

      const userWithSecret = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });

      if (!userWithSecret) {
        throw new NotFoundException('Usuario nao encontrado.');
      }

      const currentMatches = await bcrypt.compare(
        dto.currentPassword,
        userWithSecret.passwordHash,
      );

      if (!currentMatches) {
        throw new UnauthorizedException('Senha atual incorreta.');
      }

      data.passwordHash = await bcrypt.hash(newPassword, 10);
      data.refreshTokenHash = null;
      data.resetPasswordTokenHash = null;
      data.resetPasswordExpiresAt = null;
    }

    if (Object.keys(data).length === 0) {
      return this.findById(userId);
    }

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data,
      });
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Dados de perfil ja utilizados.');
      }

      throw error;
    }

    return this.findById(userId);
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    name: string;
    role: PrismaRole;
    lattesUrl: string | null;
    orcid: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      lattesUrl: user.lattesUrl,
      orcid: user.orcid,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
