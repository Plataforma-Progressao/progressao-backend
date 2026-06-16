import { Injectable } from '@nestjs/common';
import { ChecklistItemStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserOnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async bootstrapForUser(
    userId: string,
    lastProgressionDate: Date | null,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    const cycle = await this.createActiveProgressionCycle(
      userId,
      lastProgressionDate,
      tx,
    );
    await this.createChecklistItemsForUser(userId, cycle.id, tx);
  }

  private async createActiveProgressionCycle(
    userId: string,
    lastProgressionDate: Date | null,
    tx: Prisma.TransactionClient,
  ) {
    const reference = lastProgressionDate ?? new Date();
    const startYear = reference.getUTCFullYear();
    const startsAt = new Date(Date.UTC(startYear, 0, 1));
    const endsAt = new Date(Date.UTC(startYear + 1, 11, 31, 23, 59, 59));

    await tx.progressionCycle.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    return tx.progressionCycle.create({
      data: {
        userId,
        label: `Ciclo ${startYear}-${startYear + 1}`,
        startsAt,
        endsAt,
        statusLabel: 'Em andamento',
        issuedAtLabel: new Intl.DateTimeFormat('pt-BR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(new Date()),
        isActive: true,
      },
    });
  }

  private async createChecklistItemsForUser(
    userId: string,
    progressionCycleId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const templates = await tx.checklistTemplateItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (templates.length === 0) {
      return;
    }

    await tx.userChecklistItem.createMany({
      data: templates.map((template) => ({
        userId,
        progressionCycleId,
        templateItemId: template.id,
        status: ChecklistItemStatus.PENDING,
      })),
      skipDuplicates: true,
    });
  }
}
