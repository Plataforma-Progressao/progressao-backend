import { ArrayNotEmpty, IsArray, IsEnum } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class UpdateAdminUserRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Role, { each: true })
  roles!: Role[];
}
