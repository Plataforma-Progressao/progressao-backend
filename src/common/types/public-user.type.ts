import { Role } from '../enums/role.enum';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  lattesUrl: string | null;
  orcid: string | null;
  createdAt: Date;
  updatedAt: Date;
}
