import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityCategory,
  BaremaActivityRule,
  BaremaCategoryRule,
  BaremaConfig,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBaremaActivityRuleDto,
  UpdateBaremaActivityRuleDto,
} from './dto/create-barema-activity-rule.dto';
import { UpdateBaremaCategoryRuleDto } from './dto/update-barema-category-rule.dto';
import { UpdateBaremaConfigDto } from './dto/update-barema-config.dto';

export type BaremaConfigWithRules = BaremaConfig & {
  categoryRules: BaremaCategoryRule[];
  activityRules: BaremaActivityRule[];
};

@Injectable()
export class BaremaService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveConfig(): Promise<BaremaConfigWithRules> {
    const config = await this.prisma.baremaConfig.findFirst({
      where: { isActive: true },
      include: {
        categoryRules: { orderBy: { category: 'asc' } },
        activityRules: {
          where: { isActive: true },
          orderBy: [{ priority: 'desc' }, { kind: 'asc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!config) {
      throw new NotFoundException('Nenhuma configuracao de barema ativa encontrada.');
    }

    return config;
  }

  async getConfigForAdmin(): Promise<BaremaConfigWithRules> {
    const config = await this.prisma.baremaConfig.findFirst({
      where: { isActive: true },
      include: {
        categoryRules: { orderBy: { category: 'asc' } },
        activityRules: {
          orderBy: [{ priority: 'desc' }, { kind: 'asc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!config) {
      throw new NotFoundException('Nenhuma configuracao de barema ativa encontrada.');
    }

    return config;
  }

  async updateConfig(dto: UpdateBaremaConfigDto): Promise<BaremaConfig> {
    const config = await this.getActiveConfig();
    return this.prisma.baremaConfig.update({
      where: { id: config.id },
      data: {
        scoreTarget: dto.scoreTarget ?? undefined,
        isActive: dto.isActive ?? undefined,
      },
    });
  }

  async updateCategoryRule(
    category: ActivityCategory,
    dto: UpdateBaremaCategoryRuleDto,
  ): Promise<BaremaCategoryRule> {
    const config = await this.getActiveConfig();
    const rule = config.categoryRules.find((item) => item.category === category);

    if (!rule) {
      throw new NotFoundException(`Regra de categoria ${category} nao encontrada.`);
    }

    return this.prisma.baremaCategoryRule.update({
      where: { id: rule.id },
      data: {
        baseScore: dto.baseScore ?? undefined,
        workloadMultiplier: dto.workloadMultiplier ?? undefined,
        ceilingScore: dto.ceilingScore ?? undefined,
        minimumTarget: dto.minimumTarget ?? undefined,
      },
    });
  }

  async listActivityRules(): Promise<BaremaActivityRule[]> {
    const config = await this.getActiveConfig();
    return this.prisma.baremaActivityRule.findMany({
      where: { baremaConfigId: config.id },
      orderBy: [{ priority: 'desc' }, { kind: 'asc' }],
    });
  }

  async createActivityRule(
    dto: CreateBaremaActivityRuleDto,
  ): Promise<BaremaActivityRule> {
    const config = await this.getActiveConfig();
    return this.prisma.baremaActivityRule.create({
      data: {
        baremaConfigId: config.id,
        category: dto.category,
        kind: dto.kind,
        keywords: dto.keywords ?? [],
        fixedScore: dto.fixedScore ?? null,
        workloadMultiplier: dto.workloadMultiplier ?? null,
        priority: dto.priority ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateActivityRule(
    id: string,
    dto: UpdateBaremaActivityRuleDto,
  ): Promise<BaremaActivityRule> {
    const config = await this.getActiveConfig();
    const rule = await this.prisma.baremaActivityRule.findFirst({
      where: { id, baremaConfigId: config.id },
    });

    if (!rule) {
      throw new NotFoundException('Regra de atividade nao encontrada.');
    }

    return this.prisma.baremaActivityRule.update({
      where: { id },
      data: {
        category: dto.category ?? undefined,
        kind: dto.kind ?? undefined,
        keywords: dto.keywords ?? undefined,
        fixedScore: dto.fixedScore === undefined ? undefined : dto.fixedScore,
        workloadMultiplier:
          dto.workloadMultiplier === undefined
            ? undefined
            : dto.workloadMultiplier,
        priority: dto.priority ?? undefined,
        isActive: dto.isActive ?? undefined,
      },
    });
  }

  async deleteActivityRule(id: string): Promise<{ id: string }> {
    const config = await this.getActiveConfig();
    const rule = await this.prisma.baremaActivityRule.findFirst({
      where: { id, baremaConfigId: config.id },
    });

    if (!rule) {
      throw new NotFoundException('Regra de atividade nao encontrada.');
    }

    await this.prisma.baremaActivityRule.delete({ where: { id } });
    return { id };
  }

  getCategoryRule(
    config: BaremaConfigWithRules,
    category: ActivityCategory,
  ): BaremaCategoryRule {
    const rule = config.categoryRules.find((item) => item.category === category);
    if (!rule) {
      throw new NotFoundException(`Regra de categoria ${category} nao encontrada.`);
    }
    return rule;
  }
}
