import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateBaremaConfigDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  scoreTarget?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
