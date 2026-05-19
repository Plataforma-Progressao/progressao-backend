import { Injectable } from '@nestjs/common';
import { Prisma, ProgressionCycle } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgressionCyclesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ProgressionCycle[]> {
    return this.prisma.progressionCycle.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string): Promise<ProgressionCycle | null> {
    return this.prisma.progressionCycle.findUnique({ where: { id } });
  }

  create(data: Prisma.ProgressionCycleUncheckedCreateInput): Promise<ProgressionCycle> {
    return this.prisma.progressionCycle.create({ data });
  }

  update(
    id: string,
    data: Prisma.ProgressionCycleUncheckedUpdateInput,
  ): Promise<ProgressionCycle> {
    return this.prisma.progressionCycle.update({ where: { id }, data });
  }

  remove(id: string): Promise<ProgressionCycle> {
    return this.prisma.progressionCycle.delete({ where: { id } });
  }
}
