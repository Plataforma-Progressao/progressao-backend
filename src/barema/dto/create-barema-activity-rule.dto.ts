import { ActivityCategory } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateBaremaActivityRuleDto {
  @IsEnum(ActivityCategory)
  category!: ActivityCategory;

  @IsString()
  @MinLength(1)
  kind!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedScore?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  workloadMultiplier?: number | null;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBaremaActivityRuleDto {
  @IsOptional()
  @IsEnum(ActivityCategory)
  category?: ActivityCategory;

  @IsOptional()
  @IsString()
  @MinLength(1)
  kind?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedScore?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  workloadMultiplier?: number | null;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
