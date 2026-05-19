import { Injectable } from '@nestjs/common';
import { Prisma, ReportSnapshot } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportSnapshotsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ReportSnapshot[]> {
    return this.prisma.reportSnapshot.findMany({
      orderBy: { generatedAt: 'desc' },
    });
  }

  findById(id: string): Promise<ReportSnapshot | null> {
    return this.prisma.reportSnapshot.findUnique({ where: { id } });
  }

  create(data: Prisma.ReportSnapshotUncheckedCreateInput): Promise<ReportSnapshot> {
    return this.prisma.reportSnapshot.create({ data });
  }

  update(
    id: string,
    data: Prisma.ReportSnapshotUncheckedUpdateInput,
  ): Promise<ReportSnapshot> {
    return this.prisma.reportSnapshot.update({ where: { id }, data });
  }

  remove(id: string): Promise<ReportSnapshot> {
    return this.prisma.reportSnapshot.delete({ where: { id } });
  }
}
