import { Injectable } from '@nestjs/common';
import { ActivityCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ClassificationResult,
  ClassificationService,
} from './classification.service';
import { CeilingService } from './ceiling.service';
import { BaremaService } from './barema.service';

export interface OptimizeCandidate {
  ruleId: string;
  category: ActivityCategory;
  kind: string;
  score: number;
  pillarImpact: number;
  headroom: number;
  totalImpact: number;
  rationale: string;
}

export interface OptimizeClassificationResult {
  isAmbiguous: boolean;
  candidates: OptimizeCandidate[];
}

export interface OptimizeInput {
  title: string;
  description?: string;
  kind?: string;
  workloadHours: number;
  userId: string;
  cycleId?: string | null;
}

@Injectable()
export class OptimizerService {
  constructor(
    private readonly classificationService: ClassificationService,
    private readonly ceilingService: CeilingService,
    private readonly baremaService: BaremaService,
    private readonly prisma: PrismaService,
  ) {}

  async optimize(input: OptimizeInput): Promise<OptimizeClassificationResult> {
    const classification = await this.classificationService.classify({
      title: input.title,
      description: input.description,
      kind: input.kind,
      workloadHours: input.workloadHours,
    });

    const isAmbiguous = this.classificationService.isAmbiguous(classification);
    if (!isAmbiguous) {
      return { isAmbiguous: false, candidates: [] };
    }

    const candidates = await this.buildCandidates(
      classification,
      input.userId,
      input.cycleId ?? null,
    );

    return {
      isAmbiguous: true,
      candidates: candidates.sort((a, b) => b.totalImpact - a.totalImpact),
    };
  }

  private async buildCandidates(
    classification: ClassificationResult,
    userId: string,
    cycleId: string | null,
  ): Promise<OptimizeCandidate[]> {
    const config = await this.baremaService.getActiveConfig();
    const ceilingStatuses = await this.ceilingService.getCategoryStatuses(
      userId,
      cycleId,
    );

    const allCandidates = [
      {
        ruleId: classification.matchedRuleId ?? '',
        category: classification.suggestedCategory,
        kind: classification.suggestedKind,
        score: classification.suggestedScore,
      },
      ...classification.alternatives.map((item) => ({
        ruleId: item.ruleId,
        category: item.category,
        kind: item.kind,
        score: item.score,
      })),
    ].filter((item) => item.ruleId.length > 0);

    const totalApproved = await this.prismaTotalApproved(userId, cycleId);

    return allCandidates.map((candidate) => {
      const ceiling = ceilingStatuses.find(
        (item) => item.category === candidate.category,
      );
      const headroom = ceiling?.remaining ?? 0;
      const pillarImpact = Math.min(candidate.score, headroom + candidate.score);
      const categoryRule = config.categoryRules.find(
        (rule) => rule.category === candidate.category,
      );
      const minimumTarget = Number(categoryRule?.minimumTarget ?? 0);
      const currentPillar = ceiling?.currentScore ?? 0;
      const meetsMinimum =
        currentPillar + candidate.score >= minimumTarget ? 1 : 0;

      let rationale = `${this.formatCategory(candidate.category)}: ${headroom.toFixed(0)} pts de margem até o teto`;
      if (headroom <= 0) {
        rationale = `${this.formatCategory(candidate.category)}: teto já atingido`;
      } else if (headroom > candidate.score * 2) {
        rationale = `${this.formatCategory(candidate.category)} tem mais margem até o teto`;
      }
      if (meetsMinimum) {
        rationale += '; contribui para meta mínima do pilar';
      }

      return {
        ruleId: candidate.ruleId,
        category: candidate.category,
        kind: candidate.kind,
        score: candidate.score,
        pillarImpact,
        headroom,
        totalImpact: pillarImpact + meetsMinimum * 10,
        rationale,
      };
    });
  }

  private async prismaTotalApproved(
    userId: string,
    cycleId: string | null,
  ): Promise<number> {
    const where: {
      userId: string;
      status: 'APPROVED';
      progressionCycleId?: string;
    } = {
      userId,
      status: 'APPROVED',
    };

    if (cycleId) {
      where.progressionCycleId = cycleId;
    }

    const aggregate = await this.prisma.activity.aggregate({
      where,
      _sum: { score: true },
    });

    return Number(aggregate._sum.score ?? 0);
  }

  private formatCategory(category: ActivityCategory): string {
    switch (category) {
      case ActivityCategory.TEACHING:
        return 'Ensino';
      case ActivityCategory.RESEARCH:
        return 'Pesquisa';
      case ActivityCategory.OUTREACH:
        return 'Extensao';
      case ActivityCategory.MANAGEMENT:
        return 'Gestao';
      default:
        return category;
    }
  }
}
