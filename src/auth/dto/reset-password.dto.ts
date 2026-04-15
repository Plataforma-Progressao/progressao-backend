import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';
import { IsNotEmpty, Matches, MaxLength } from 'class-validator';
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

export class ResetPasswordDto {
  @Transform(({ value }: { value: unknown }) => normalizeText(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  token: string;

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
  @Match<ResetPasswordDto>('password', {
    message: 'Confirmacao de senha deve ser igual a senha.',
  })
  confirmPassword: string;
}
