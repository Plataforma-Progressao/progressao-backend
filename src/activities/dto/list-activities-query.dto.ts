import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { ActivityCategory } from './list-activities.dto';
import type { ActivityStatus } from './list-activities.dto';

export class ListActivitiesQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize = 10;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsIn(['TEACHING', 'RESEARCH', 'OUTREACH', 'MANAGEMENT'])
  category?: ActivityCategory;

  @IsOptional()
  @IsIn(['APPROVED', 'PENDING', 'REJECTED'])
  status?: ActivityStatus;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  term?: string;
}
