export interface ActivityChangeLogDto {
  readonly id: string;
  readonly field: string;
  readonly fieldLabel: string;
  readonly oldValue: string | null;
  readonly newValue: string | null;
  readonly changedAt: string;
  readonly changedByName: string | null;
}

export interface ActivityChangeLogListDto {
  readonly items: readonly ActivityChangeLogDto[];
  readonly total: number;
}
