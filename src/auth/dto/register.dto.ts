import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  Equals,
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  Matches,
  MinLength,
} from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_POLICY_REGEX,
} from '../constants/password-policy.constants';
import { Match } from './validators/match.validator';

function normalizeText(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim();
}

function normalizeEmail(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim().toLowerCase();
}

function normalizeCpf(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.replace(/\D/g, '');
}

function normalizePracticeAreas(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((item) => (typeof item === 'string' ? item.trim() : item));
}

export class RegisterDto {
  @Transform(({ value }: { value: unknown }) => normalizeText(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  fullName: string;

  @Transform(({ value }: { value: unknown }) => normalizeCpf(value))
  @IsString()
  @Matches(/^\d{11}$/, { message: 'CPF deve conter 11 digitos.' })
  cpf: string;

  @Transform(({ value }: { value: unknown }) => normalizeEmail(value))
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Transform(({ value }: { value: unknown }) => normalizeText(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  university: string;

  @Transform(({ value }: { value: unknown }) => normalizeText(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  center: string;

  @Transform(({ value }: { value: unknown }) => normalizeText(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  department: string;

  @Transform(({ value }: { value: unknown }) => normalizePracticeAreas(value))
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(80, { each: true })
  practiceAreas: string[];

  @Transform(({ value }: { value: unknown }) => normalizeText(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(60)
  careerClass: string;

  @Transform(({ value }: { value: unknown }) => normalizeText(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(40)
  currentLevel: string;

  @Type(() => Date)
  @IsDate()
  lastProgressionDate: Date;

  @Transform(({ value }: { value: unknown }) => normalizeText(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_POLICY_REGEX, {
    message: 'Senha deve conter pelo menos uma letra e um numero.',
  })
  password: string;

  @Transform(({ value }: { value: unknown }) => normalizeText(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Match<RegisterDto>('password', {
    message: 'Confirmacao de senha deve ser igual a senha.',
  })
  confirmPassword: string;

  @IsBoolean()
  @Equals(true, { message: 'Aceite dos termos e obrigatorio.' })
  acceptTerms: boolean;

  @IsBoolean()
  @Equals(true, { message: 'Aceite da LGPD e obrigatorio.' })
  acceptLgpd: boolean;
}
