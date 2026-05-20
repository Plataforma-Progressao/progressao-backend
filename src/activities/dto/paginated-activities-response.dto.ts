import type { ActivityListItemDto } from './list-activities.dto';

export interface PaginatedActivitiesResponseDto {
  readonly items: readonly ActivityListItemDto[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}
