import { ActivityCategory } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateBaremaCategoryRuleDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  workloadMultiplier?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ceilingScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumTarget?: number;
}

export class UpdateBaremaCategoryRuleParamDto {
  @IsEnum(ActivityCategory)
  category!: ActivityCategory;
}
