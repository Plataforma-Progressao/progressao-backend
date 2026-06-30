import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import type { ActivityCategoryCode } from './create-activity.dto';

export class UpdateActivityDto {
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Titulo deve ter pelo menos 8 caracteres.' })
  @MaxLength(160, { message: 'Titulo deve ter no maximo 160 caracteres.' })
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Descricao deve ter pelo menos 10 caracteres.' })
  @MaxLength(1200, { message: 'Descricao deve ter no maximo 1200 caracteres.' })
  description?: string;

  @IsOptional()
  @IsIn(['TEACHING', 'RESEARCH', 'OUTREACH', 'MANAGEMENT'], {
    message: 'Categoria invalida.',
  })
  category?: ActivityCategoryCode;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Carga horaria deve ser um numero valido.' },
  )
  @Min(0, { message: 'Carga horaria deve ser maior ou igual a 0.' })
  workloadHours?: number;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Pontuacao deve ser um numero valido.' },
  )
  @Min(0, { message: 'Pontuacao deve ser maior ou igual a 0.' })
  score?: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  term?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  kind?: string;

  @IsOptional()
  @IsString()
  matchedRuleId?: string;
}
