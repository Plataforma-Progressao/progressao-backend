import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ClassifyActivityDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  kind?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  workloadHours!: number;
}

export class OptimizeClassificationDto extends ClassifyActivityDto {}
