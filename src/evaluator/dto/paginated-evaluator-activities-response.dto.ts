import { EvaluatorActivityQueueItemDto } from './evaluator-activity-queue-item.dto';

export interface PaginatedEvaluatorActivitiesResponseDto {
  readonly items: readonly EvaluatorActivityQueueItemDto[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}
