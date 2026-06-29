import { ActivityListItemDto } from '../../activities/dto/list-activities.dto';
import { ActivityEvidenceDto } from '../../activities/dto/activity-evidence.dto';

export interface EvaluatorActivityDetailDto extends ActivityListItemDto {
  readonly reviewedAt: string | null;
  readonly teacher: {
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly department: string | null;
    readonly university: string | null;
    readonly careerClass: string | null;
    readonly currentLevel: string | null;
  };
  readonly evidences: readonly ActivityEvidenceDto[];
  readonly statusHistory: readonly {
    readonly id: string;
    readonly fromStatus: string;
    readonly toStatus: string;
    readonly note: string | null;
    readonly changedAt: string;
    readonly changedByName: string | null;
  }[];
  readonly changeLogs: readonly {
    readonly id: string;
    readonly field: string;
    readonly fieldLabel: string;
    readonly oldValue: string | null;
    readonly newValue: string | null;
    readonly changedAt: string;
    readonly changedByName: string | null;
  }[];
}
