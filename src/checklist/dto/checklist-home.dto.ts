export type ChecklistItemStatusCode = 'PENDING' | 'ATTENTION' | 'COMPLETED';

export interface ChecklistHomeItemDto {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly status: ChecklistItemStatusCode;
  readonly note: string | null;
  readonly submittedAt: string | null;
  readonly updatedAt: string;
}

export interface ChecklistHomeDto {
  readonly total: number;
  readonly completed: number;
  readonly attention: number;
  readonly pending: number;
  readonly completionPercentage: number;
  readonly items: readonly ChecklistHomeItemDto[];
}
