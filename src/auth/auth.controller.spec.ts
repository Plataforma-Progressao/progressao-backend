import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../common/enums/role.enum';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
  });

  it('should delegate register to AuthService', async () => {
    const registerDto = {
      fullName: 'Test User',
      cpf: '12345678901',
      email: 'user@example.com',
      university: 'UFMG',
      center: 'ICEX',
      department: 'DCC',
      practiceAreas: ['backend'],
      careerClass: 'Adjunto',
      currentLevel: 'I',
      lastProgressionDate: new Date('2025-01-10'),
      password: 'Password@123',
      confirmPassword: 'Password@123',
      acceptTerms: true,
      acceptLgpd: true,
    };

    authService.register.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: {
        id: 'user-id',
        email: registerDto.email,
        name: registerDto.fullName,
        role: Role.USER,
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-01-10'),
      },
    });

    const result = await controller.register(registerDto);

    expect(authService.register).toHaveBeenCalledWith(registerDto);
    expect(result.user.email).toBe(registerDto.email);
  });

  it('should delegate login to AuthService', async () => {
    const loginDto = {
      email: 'user@example.com',
      password: 'Password@123',
    };

    authService.login.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: {
        id: 'user-id',
        email: loginDto.email,
        name: 'Test User',
        role: Role.USER,
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-01-10'),
      },
    });

    const result = await controller.login(loginDto);

    expect(authService.login).toHaveBeenCalledWith(loginDto);
    expect(result.accessToken).toBe('access');
  });

  it('should delegate refresh to AuthService', async () => {
    const refreshTokenDto = { refreshToken: 'valid-refresh-token' };

    authService.refresh.mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });

    const result = await controller.refresh(refreshTokenDto);

    expect(authService.refresh).toHaveBeenCalledWith(refreshTokenDto);
    expect(result.refreshToken).toBe('new-refresh');
  });

  it('should delegate logout to AuthService', async () => {
    const logoutDto = { refreshToken: 'valid-refresh-token' };
    authService.logout.mockResolvedValue({ revoked: true });

    const result = await controller.logout(logoutDto);

    expect(authService.logout).toHaveBeenCalledWith(logoutDto);
    expect(result).toEqual({ revoked: true });
  });

  it('should delegate forgotPassword to AuthService', async () => {
    const forgotPasswordDto = { email: 'user@example.com' };
    authService.forgotPassword.mockResolvedValue({
      message: 'Se o email existir, enviaremos instrucoes de recuperacao.',
    });

    const result = await controller.forgotPassword(forgotPasswordDto);

    expect(authService.forgotPassword).toHaveBeenCalledWith(forgotPasswordDto);
    expect(result.message).toContain('email existir');
  });

  it('should delegate resetPassword to AuthService', async () => {
    const resetPasswordDto = {
      token: 'valid-token-with-minimum-size-32chars',
      password: 'Password@123',
      confirmPassword: 'Password@123',
    };
    authService.resetPassword.mockResolvedValue({ reset: true });

    const result = await controller.resetPassword(resetPasswordDto);

    expect(authService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
    expect(result).toEqual({ reset: true });
  });
});
