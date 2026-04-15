export interface RegisterUserInput {
  fullName: string;
  cpf: string;
  email: string;
  university: string;
  center: string;
  department: string;
  practiceAreas: string[];
  careerClass: string;
  currentLevel: string;
  lastProgressionDate: Date;
  password: string;
  acceptTerms: boolean;
  acceptLgpd: boolean;
}
