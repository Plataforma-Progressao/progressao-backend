import { IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres.' })
  name?: string;

  @IsOptional()
  @IsString()
  lattesUrl?: string;

  @IsOptional()
  @IsString()
  orcid?: string;

  @ValidateIf((o) => Boolean(o.newPassword?.length))
  @IsString({ message: 'Informe a senha atual para alterar a senha.' })
  @MinLength(8, { message: 'Senha atual invalida.' })
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Nova senha deve ter pelo menos 8 caracteres.' })
  newPassword?: string;
}
