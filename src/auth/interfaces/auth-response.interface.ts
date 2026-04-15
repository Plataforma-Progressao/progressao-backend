import { PublicUser } from '../../common/types/public-user.type';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends TokenPair {
  user: PublicUser;
}

export interface LogoutResponse {
  revoked: true;
}

export interface ResetPasswordResponse {
  reset: true;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string;
}
