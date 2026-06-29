import { Role } from '../../common/enums/role.enum';

export interface AdminUserListItemDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly roles: readonly Role[];
  readonly department: string | null;
  readonly university: string | null;
  readonly createdAt: string;
}
