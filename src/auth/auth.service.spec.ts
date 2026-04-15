/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../common/enums/role.enum';
import { PublicUser } from '../common/types/public-user.type';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockPublicUser: PublicUser = {
    id: 'user-uuid',
    email: 'test@example.com',
    name: 'Test User',
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithPassword = {
    ...mockPublicUser,
    passwordHash: 'hashed-password-placeholder',
    refreshTokenHash: 'hashed-refresh-token',
    resetPasswordTokenHash: null,
    resetPasswordExpiresAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            createFromRegistration: jest.fn(),
            findById: jest.fn(),
            findByIdWithSensitiveFields: jest.fn(),
            findByEmailWithPassword: jest.fn(),
            setRefreshTokenHash: jest.fn(),
            rotateRefreshTokenHash: jest.fn(),
            setResetPasswordToken: jest.fn(),
            findByResetPasswordTokenHash: jest.fn(),
            updatePassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              const values: Record<string, unknown> = {
                JWT_EXPIRES_IN_SECONDS: 900,
                JWT_REFRESH_EXPIRES_IN_SECONDS: 604800,
                RESET_PASSWORD_TOKEN_EXPIRES_MINUTES: 30,
              };

              return values[key] ?? defaultValue;
            }),
            getOrThrow: jest.fn((key: string) => {
              const values: Record<string, string> = {
                JWT_SECRET: 'jwt-secret-key-with-safe-size',
                JWT_REFRESH_SECRET: 'jwt-refresh-secret-key-safe-size',
              };

              return values[key];
            }),
          },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create user and return token pair + user', async () => {
      const registerDto = {
        fullName: 'Test User',
        cpf: '12345678901',
        email: 'test@example.com',
        university: 'ufmg',
        center: 'icex',
        department: 'dcc',
        practiceAreas: ['ai'],
        careerClass: 'adjunto',
        currentLevel: 'II',
        lastProgressionDate: new Date('2025-01-01'),
        password: 'password123',
        confirmPassword: 'password123',
        acceptTerms: true,
        acceptLgpd: true,
      };

      (usersService.createFromRegistration as jest.Mock).mockResolvedValue(
        mockPublicUser,
      );
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');

      const result = await authService.register(registerDto);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockPublicUser,
      });
      expect(usersService.createFromRegistration).toHaveBeenCalled();
      expect(usersService.setRefreshTokenHash).toHaveBeenCalledWith(
        mockPublicUser.id,
        'hashed-refresh-token',
      );
    });

    it('should reject registration with future last progression date', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await expect(
        authService.register({
          fullName: 'Test User',
          cpf: '12345678901',
          email: 'test@example.com',
          university: 'ufmg',
          center: 'icex',
          department: 'dcc',
          practiceAreas: ['ai'],
          careerClass: 'adjunto',
          currentLevel: 'II',
          lastProgressionDate: tomorrow,
          password: 'password123',
          confirmPassword: 'password123',
          acceptTerms: true,
          acceptLgpd: true,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should propagate conflict when identifiers already exist', async () => {
      (usersService.createFromRegistration as jest.Mock).mockRejectedValue(
        new ConflictException('Dados de cadastro ja utilizados.'),
      );

      await expect(
        authService.register({
          fullName: 'Test User',
          cpf: '12345678901',
          email: 'test@example.com',
          university: 'ufmg',
          center: 'icex',
          department: 'dcc',
          practiceAreas: ['ai'],
          careerClass: 'adjunto',
          currentLevel: 'II',
          lastProgressionDate: new Date('2025-01-01'),
          password: 'password123',
          confirmPassword: 'password123',
          acceptTerms: true,
          acceptLgpd: true,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return token pair and user on valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue(
        mockUserWithPassword,
      );
      (usersService.findById as jest.Mock).mockResolvedValue(mockPublicUser);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');

      const result = await authService.login(loginDto);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockPublicUser,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        authService.login({
          email: 'missing@example.com',
          password: 'secret123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should rotate refresh token and return new token pair', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: mockPublicUser.id,
        email: mockPublicUser.email,
        role: mockPublicUser.role,
        type: 'refresh',
      });
      (usersService.findByIdWithSensitiveFields as jest.Mock).mockResolvedValue(
        mockUserWithPassword,
      );
      (usersService.findById as jest.Mock).mockResolvedValue(mockPublicUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-refresh-token');
      (usersService.rotateRefreshTokenHash as jest.Mock).mockResolvedValue(
        true,
      );

      const result = await authService.refresh({
        refreshToken: 'old-refresh-token',
      });

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      expect(usersService.rotateRefreshTokenHash).toHaveBeenCalledWith(
        mockPublicUser.id,
        mockUserWithPassword.refreshTokenHash,
        'hashed-new-refresh-token',
      );
    });

    it('should throw UnauthorizedException when token rotation compare-and-set fails', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: mockPublicUser.id,
        email: mockPublicUser.email,
        role: mockPublicUser.role,
        type: 'refresh',
      });
      (usersService.findByIdWithSensitiveFields as jest.Mock).mockResolvedValue(
        mockUserWithPassword,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-refresh-token');
      (usersService.rotateRefreshTokenHash as jest.Mock).mockResolvedValue(
        false,
      );

      await expect(
        authService.refresh({ refreshToken: 'old-refresh-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
        new Error('invalid token'),
      );

      await expect(
        authService.refresh({ refreshToken: 'invalid-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when stored hash does not match', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: mockPublicUser.id,
        email: mockPublicUser.email,
        role: mockPublicUser.role,
        type: 'refresh',
      });
      (usersService.findByIdWithSensitiveFields as jest.Mock).mockResolvedValue(
        mockUserWithPassword,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.refresh({ refreshToken: 'stolen-refresh-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke refresh token when token is valid', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: mockPublicUser.id,
        email: mockPublicUser.email,
        role: mockPublicUser.role,
        type: 'refresh',
      });

      const result = await authService.logout({
        refreshToken: 'valid-refresh-token',
      });

      expect(result).toEqual({ revoked: true });
      expect(usersService.setRefreshTokenHash).toHaveBeenCalledWith(
        mockPublicUser.id,
        null,
      );
    });

    it('should remain idempotent for invalid token', async () => {
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
        new Error('invalid token'),
      );

      const result = await authService.logout({
        refreshToken: 'invalid-refresh-token',
      });

      expect(result).toEqual({ revoked: true });
    });
  });

  describe('forgotPassword', () => {
    it('should return generic message without exposing token by default', async () => {
      const result = await authService.forgotPassword({
        email: 'test@example.com',
      });

      expect(result).toEqual({
        message: 'Se o email existir, enviaremos instrucoes de recuperacao.',
      });
      expect(usersService.setResetPasswordToken).toHaveBeenCalled();
    });

    it('should expose reset token only when debug flag is enabled', async () => {
      jest
        .spyOn(configService, 'get')
        .mockImplementation((key: string, defaultValue?: unknown) => {
          if (key === 'AUTH_EXPOSE_RESET_TOKEN') {
            return true;
          }

          const values: Record<string, unknown> = {
            JWT_EXPIRES_IN_SECONDS: 900,
            JWT_REFRESH_EXPIRES_IN_SECONDS: 604800,
            RESET_PASSWORD_TOKEN_EXPIRES_MINUTES: 30,
          };

          return values[key] ?? defaultValue;
        });

      const result = await authService.forgotPassword({
        email: 'test@example.com',
      });

      expect(result).toEqual({
        message: 'Se o email existir, enviaremos instrucoes de recuperacao.',
        resetToken: expect.any(String),
      });
    });
  });

  describe('resetPassword', () => {
    it('should update password when token is valid', async () => {
      const token = 'valid-token-string-for-reset-password-flow';
      const tokenHash = createHash('sha256').update(token).digest('hex');

      (
        usersService.findByResetPasswordTokenHash as jest.Mock
      ).mockResolvedValue(mockUserWithPassword);

      const result = await authService.resetPassword({
        token,
        password: 'newSecurePass123',
        confirmPassword: 'newSecurePass123',
      });

      expect(usersService.findByResetPasswordTokenHash).toHaveBeenCalledWith(
        tokenHash,
      );
      expect(usersService.updatePassword).toHaveBeenCalledWith(
        mockUserWithPassword.id,
        'newSecurePass123',
      );
      expect(result).toEqual({ reset: true });
    });

    it('should throw UnauthorizedException for invalid reset token', async () => {
      (
        usersService.findByResetPasswordTokenHash as jest.Mock
      ).mockResolvedValue(null);

      await expect(
        authService.resetPassword({
          token: 'invalid-token',
          password: 'newSecurePass123',
          confirmPassword: 'newSecurePass123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
