import { Injectable } from '@nestjs/common';
import { ActivityCategory, BaremaActivityRule } from '@prisma/client';
import { BaremaService, BaremaConfigWithRules } from './barema.service';
import { ScoringEngineService } from './scoring-engine.service';

export type ClassificationConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ClassificationCandidate {
  ruleId: string;
  category: ActivityCategory;
  kind: string;
  score: number;
  confidence: ClassificationConfidence;
  matchedKeywords: string[];
}

export interface ClassificationResult {
  suggestedCategory: ActivityCategory;
  suggestedKind: string;
  suggestedScore: number;
  matchedRuleId: string | null;
  confidence: ClassificationConfidence;
  alternatives: ClassificationCandidate[];
}

export interface ClassifyInput {
  title: string;
  description?: string;
  kind?: string;
  workloadHours: number;
}

@Injectable()
export class ClassificationService {
  constructor(
    private readonly baremaService: BaremaService,
    private readonly scoringEngine: ScoringEngineService,
  ) {}

  async classify(input: ClassifyInput): Promise<ClassificationResult> {
    const config = await this.baremaService.getActiveConfig();
    const haystack = this.buildHaystack(input);
    const candidates = this.matchRules(config, haystack, input.workloadHours);

    if (candidates.length === 0) {
      const fallbackCategory = ActivityCategory.TEACHING;
      const categoryRule = this.baremaService.getCategoryRule(config, fallbackCategory);
      const score = this.scoringEngine.calculateFromCategoryRule(
        categoryRule,
        input.workloadHours,
      );

      return {
        suggestedCategory: fallbackCategory,
        suggestedKind: input.kind?.trim() || 'Atividade geral',
        suggestedScore: score,
        matchedRuleId: null,
        confidence: 'LOW',
        alternatives: [],
      };
    }

    const [best, ...rest] = candidates;
    return {
      suggestedCategory: best.category,
      suggestedKind: best.kind,
      suggestedScore: best.score,
      matchedRuleId: best.ruleId,
      confidence: best.confidence,
      alternatives: rest.slice(0, 2),
    };
  }

  isAmbiguous(result: ClassificationResult): boolean {
    if (result.alternatives.length === 0) {
      return false;
    }

    const categories = new Set([
      result.suggestedCategory,
      ...result.alternatives.map((item) => item.category),
    ]);

    return (
      categories.size >= 2 &&
      result.alternatives.some(
        (item) =>
          item.confidence === 'HIGH' || item.confidence === 'MEDIUM',
      )
    );
  }

  private buildHaystack(input: ClassifyInput): string {
    return [input.title, input.description ?? '', input.kind ?? '']
      .join(' ')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }

  private matchRules(
    config: BaremaConfigWithRules,
    haystack: string,
    workloadHours: number,
  ): ClassificationCandidate[] {
    const candidates: ClassificationCandidate[] = [];

    for (const rule of config.activityRules) {
      if (!rule.isActive) {
        continue;
      }

      const matchedKeywords = rule.keywords.filter((keyword) =>
        this.normalizeText(keyword).length > 0 &&
        haystack.includes(this.normalizeText(keyword)),
      );

      const kindMatch =
        this.normalizeText(rule.kind).length > 0 &&
        haystack.includes(this.normalizeText(rule.kind));

      const matchCount = matchedKeywords.length + (kindMatch ? 1 : 0);

      if (matchCount === 0) {
        continue;
      }

      const categoryRule = this.baremaService.getCategoryRule(config, rule.category);
      const score = this.scoringEngine.calculateFromActivityRule(
        rule,
        workloadHours,
        categoryRule,
      );

      candidates.push({
        ruleId: rule.id,
        category: rule.category,
        kind: rule.kind,
        score,
        confidence: this.resolveConfidence(matchCount, kindMatch),
        matchedKeywords,
      });
    }

    return candidates.sort((a, b) => {
      const confidenceOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const diff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
      if (diff !== 0) {
        return diff;
      }
      return b.score - a.score;
    });
  }

  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }

  private resolveConfidence(
    matchCount: number,
    kindMatch: boolean,
  ): ClassificationConfidence {
    if (kindMatch || matchCount >= 2) {
      return 'HIGH';
    }
    if (matchCount >= 1) {
      return 'MEDIUM';
    }
    return 'LOW';
  }
}
