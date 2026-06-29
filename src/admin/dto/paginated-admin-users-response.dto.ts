import { AdminUserListItemDto } from './admin-user-list-item.dto';

export interface PaginatedAdminUsersResponseDto {
  readonly items: readonly AdminUserListItemDto[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}
