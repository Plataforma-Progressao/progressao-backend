import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Role } from '../common/enums/role.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { RegisterUserInput } from '../common/interfaces/register-user-input.interface';
import { PublicUser } from '../common/types/public-user.type';
import { UsersService } from '../users/users.service';
import {
  AuthResponse,
  ForgotPasswordResponse,
  LogoutResponse,
  ResetPasswordResponse,
  TokenPair,
} from './interfaces/auth-response.interface';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

interface JwtRefreshPayload extends JwtPayload {
  type: 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    if (registerDto.lastProgressionDate.getTime() > Date.now()) {
      throw new BadRequestException(
        'Data da ultima progressao nao pode ser futura.',
      );
    }

    const registrationData: RegisterUserInput = {
      fullName: registerDto.fullName,
      cpf: registerDto.cpf,
      email: registerDto.email,
      university: registerDto.university,
      center: registerDto.center,
      department: registerDto.department,
      practiceAreas: registerDto.practiceAreas,
      careerClass: registerDto.careerClass,
      currentLevel: registerDto.currentLevel,
      lastProgressionDate: registerDto.lastProgressionDate,
      password: registerDto.password,
      acceptTerms: registerDto.acceptTerms,
      acceptLgpd: registerDto.acceptLgpd,
    };

    const createdUser =
      await this.usersService.createFromRegistration(registrationData);

    const tokenPair = await this.issueTokenPair(createdUser);
    await this.persistRefreshToken(createdUser.id, tokenPair.refreshToken);

    return {
      ...tokenPair,
      user: createdUser,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const tokenPair = await this.issueTokenPair(user);
    await this.persistRefreshToken(user.id, tokenPair.refreshToken);

    return {
      ...tokenPair,
      user,
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(refreshTokenDto.refreshToken);
    const user = await this.usersService.findByIdWithSensitiveFields(
      payload.sub,
    );

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token invalido ou expirado.');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshTokenDto.refreshToken,
      user.refreshTokenHash,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Refresh token invalido ou expirado.');
    }

    const publicUser: PublicUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      lattesUrl: user.lattesUrl ?? null,
      orcid: user.orcid ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const tokenPair = await this.issueTokenPair(publicUser);
    const newRefreshTokenHash = await this.hashRefreshToken(
      tokenPair.refreshToken,
    );
    const rotated = await this.usersService.rotateRefreshTokenHash(
      publicUser.id,
      user.refreshTokenHash,
      newRefreshTokenHash,
    );

    if (!rotated) {
      throw new UnauthorizedException('Refresh token invalido ou expirado.');
    }

    return tokenPair;
  }

  async logout(logoutDto: LogoutDto): Promise<LogoutResponse> {
    let payload: JwtRefreshPayload;

    try {
      payload = await this.verifyRefreshToken(logoutDto.refreshToken);
    } catch {
      // Keep this endpoint idempotent and do not leak token state.
      return { revoked: true };
    }

    await this.usersService.setRefreshTokenHash(payload.sub, null);

    return { revoked: true };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponse> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() +
        this.configService.get<number>(
          'RESET_PASSWORD_TOKEN_EXPIRES_MINUTES',
          30,
        ) *
          60 *
          1000,
    );

    await this.usersService.setResetPasswordToken(
      forgotPasswordDto.email,
      tokenHash,
      expiresAt,
    );

    const response: ForgotPasswordResponse = {
      message: 'Se o email existir, enviaremos instrucoes de recuperacao.',
    };

    if (this.configService.get<boolean>('AUTH_EXPOSE_RESET_TOKEN', false)) {
      response.resetToken = rawToken;
    }

    return response;
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<ResetPasswordResponse> {
    const tokenHash = this.hashToken(resetPasswordDto.token);
    const user =
      await this.usersService.findByResetPasswordTokenHash(tokenHash);

    if (!user) {
      throw new UnauthorizedException(
        'Token de recuperacao invalido ou expirado.',
      );
    }

    await this.usersService.updatePassword(user.id, resetPasswordDto.password);

    return { reset: true };
  }

  private async validateUser(
    email: string,
    password: string,
  ): Promise<PublicUser> {
    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    return this.usersService.findById(user.id);
  }

  private async issueTokenPair(user: PublicUser): Promise<TokenPair> {
    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.signRefreshToken(user);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async signAccessToken(user: PublicUser): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.configService.get<number>('JWT_EXPIRES_IN_SECONDS', 900),
    });
  }

  private async signRefreshToken(user: PublicUser): Promise<string> {
    const payload: JwtRefreshPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<number>(
        'JWT_REFRESH_EXPIRES_IN_SECONDS',
        604800,
      ),
    });
  }

  private async verifyRefreshToken(token: string): Promise<JwtRefreshPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(
        token,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Refresh token invalido ou expirado.');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Refresh token invalido ou expirado.');
    }
  }

  private async persistRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const refreshTokenHash = await this.hashRefreshToken(refreshToken);
    await this.usersService.setRefreshTokenHash(userId, refreshTokenHash);
  }

  private hashRefreshToken(refreshToken: string): Promise<string> {
    return bcrypt.hash(refreshToken, 10);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
