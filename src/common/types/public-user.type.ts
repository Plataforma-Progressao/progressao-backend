import { Role } from '../enums/role.enum';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  lattesUrl: string | null;
  orcid: string | null;
  createdAt: Date;
  updatedAt: Date;
  careerClass: string | null;
  currentLevel: string | null;
  university?: string | null;
  department?: string | null;
}
