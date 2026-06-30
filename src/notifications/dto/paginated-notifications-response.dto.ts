import { Notification } from '@prisma/client';

export interface PaginatedNotificationsResponseDto {
  items: Notification[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
