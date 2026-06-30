import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import type { ActivityCategoryCode } from './create-activity.dto';

export class EstimateActivityScoreDto {
  @IsIn(['TEACHING', 'RESEARCH', 'OUTREACH', 'MANAGEMENT'], {
    message: 'Categoria invalida.',
  })
  category!: ActivityCategoryCode;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Carga horaria deve ser um numero valido.' },
  )
  @Min(0, { message: 'Carga horaria deve ser maior ou igual a 0.' })
  workloadHours!: number;

  @IsOptional()
  @IsString()
  matchedRuleId?: string;
}
