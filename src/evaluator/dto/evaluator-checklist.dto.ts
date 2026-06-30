import { ChecklistItemStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class ListEvaluatorChecklistQueryDto {
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsOptional()
  @IsEnum(ChecklistItemStatus)
  status?: ChecklistItemStatus;
}

export class RejectChecklistItemDto {
  @IsString()
  @MinLength(4, { message: 'Informe o motivo da rejeicao.' })
  note!: string;
}
