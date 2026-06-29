import { ActivityListItemDto } from '../../activities/dto/list-activities.dto';

export interface EvaluatorActivityQueueItemDto extends ActivityListItemDto {
  readonly teacher: {
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly department: string | null;
  };
}
