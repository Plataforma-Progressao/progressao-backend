import { Injectable } from '@nestjs/common';
import { Prisma, UserScoreSummary } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserScoreSummariesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<UserScoreSummary[]> {
    return this.prisma.userScoreSummary.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  findById(id: string): Promise<UserScoreSummary | null> {
    return this.prisma.userScoreSummary.findUnique({ where: { id } });
  }

  create(data: Prisma.UserScoreSummaryUncheckedCreateInput): Promise<UserScoreSummary> {
    return this.prisma.userScoreSummary.create({ data });
  }

  update(
    id: string,
    data: Prisma.UserScoreSummaryUncheckedUpdateInput,
  ): Promise<UserScoreSummary> {
    return this.prisma.userScoreSummary.update({ where: { id }, data });
  }

  remove(id: string): Promise<UserScoreSummary> {
    return this.prisma.userScoreSummary.delete({ where: { id } });
  }
}
