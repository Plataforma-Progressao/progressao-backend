import { ActivityListItemDto } from './list-activities.dto';
import { ActivityEvidenceDto } from './activity-evidence.dto';

export interface ActivityDetailDto extends ActivityListItemDto {
  readonly evidences: readonly ActivityEvidenceDto[];
}
