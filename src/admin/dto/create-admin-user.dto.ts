import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class CreateAdminUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Role, { each: true })
  roles!: Role[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  university?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  careerClass?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  currentLevel?: string;

  @IsOptional()
  @IsDateString()
  lastProgressionDate?: string;
}
