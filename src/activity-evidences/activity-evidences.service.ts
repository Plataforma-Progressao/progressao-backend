import { Injectable } from '@nestjs/common';
import { ActivityEvidence, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityEvidencesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ActivityEvidence[]> {
    return this.prisma.activityEvidence.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findById(id: string): Promise<ActivityEvidence | null> {
    return this.prisma.activityEvidence.findUnique({ where: { id } });
  }

  create(data: Prisma.ActivityEvidenceUncheckedCreateInput): Promise<ActivityEvidence> {
    return this.prisma.activityEvidence.create({ data });
  }

  update(
    id: string,
    data: Prisma.ActivityEvidenceUncheckedUpdateInput,
  ): Promise<ActivityEvidence> {
    return this.prisma.activityEvidence.update({ where: { id }, data });
  }

  remove(id: string): Promise<ActivityEvidence> {
    return this.prisma.activityEvidence.delete({ where: { id } });
  }
}
