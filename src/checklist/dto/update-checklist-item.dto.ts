import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export type ChecklistItemStatusCode = 'PENDING' | 'ATTENTION' | 'COMPLETED';

export class UpdateChecklistItemDto {
  @IsIn(['PENDING', 'ATTENTION', 'COMPLETED'], {
    message: 'Status invalido.',
  })
  status!: ChecklistItemStatusCode;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
