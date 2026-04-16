import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

function normalizeEmail(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim().toLowerCase();
}

export class ForgotPasswordDto {
  @Transform(({ value }: { value: unknown }) => normalizeEmail(value))
  @IsEmail()
  email!: string;
}
