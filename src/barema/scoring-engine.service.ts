import { Injectable } from '@nestjs/common';
import { ActivityCategory, BaremaActivityRule, BaremaCategoryRule } from '@prisma/client';
import { BaremaService } from './barema.service';

export interface ScoreCalculationInput {
  category: ActivityCategory;
  workloadHours: number;
  activityRule?: BaremaActivityRule | null;
}

@Injectable()
export class ScoringEngineService {
  constructor(private readonly baremaService: BaremaService) {}

  async calculateScore(input: ScoreCalculationInput): Promise<number> {
    const config = await this.baremaService.getActiveConfig();
    const categoryRule = this.baremaService.getCategoryRule(config, input.category);

    if (input.activityRule) {
      return this.calculateFromActivityRule(input.activityRule, input.workloadHours, categoryRule);
    }

    return this.calculateFromCategoryRule(categoryRule, input.workloadHours);
  }

  calculateFromCategoryRule(
    categoryRule: BaremaCategoryRule,
    workloadHours: number,
  ): number {
    const base = Number(categoryRule.baseScore);
    const multiplier = Number(categoryRule.workloadMultiplier);
    return this.roundScore(base + workloadHours * multiplier);
  }

  calculateFromActivityRule(
    activityRule: BaremaActivityRule,
    workloadHours: number,
    categoryRule: BaremaCategoryRule,
  ): number {
    if (activityRule.fixedScore !== null) {
      const fixed = Number(activityRule.fixedScore);
      const multiplier =
        activityRule.workloadMultiplier !== null
          ? Number(activityRule.workloadMultiplier)
          : Number(categoryRule.workloadMultiplier);
      return this.roundScore(fixed + workloadHours * multiplier);
    }

    return this.calculateFromCategoryRule(categoryRule, workloadHours);
  }

  async estimateScore(
    category: ActivityCategory,
    workloadHours: number,
    activityRuleId?: string | null,
  ): Promise<{ score: number; matchedRuleId: string | null }> {
    const config = await this.baremaService.getActiveConfig();
    let activityRule: BaremaActivityRule | null = null;

    if (activityRuleId) {
      activityRule =
        config.activityRules.find((rule) => rule.id === activityRuleId) ?? null;
    }

    const score = await this.calculateScore({
      category,
      workloadHours,
      activityRule,
    });

    return { score, matchedRuleId: activityRule?.id ?? null };
  }

  private roundScore(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
