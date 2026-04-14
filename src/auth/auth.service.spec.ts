/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByEmailWithPassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create user and return auth response with token', async () => {
      const createUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      const token = 'mocked-jwt-token';

      jest.spyOn(usersService, 'create').mockResolvedValue(mockPublicUser);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(token);

      const result = await authService.register(createUserDto);

      expect(result).toEqual({
        accessToken: token,
        user: mockPublicUser,
      });
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(jwtService.signAsync).toHaveBeenCalled();
    });

    it('should propagate ConflictException if email already exists', async () => {
      const createUserDto = {
        email: 'existing@example.com',
        name: 'Test User',
        password: 'password123',
      };

      jest
        .spyOn(usersService, 'create')
        .mockRejectedValue(new ConflictException('Email ja cadastrado.'));

      await expect(authService.register(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should return auth response with token on valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const token = 'mocked-jwt-token';

      jest
        .spyOn(usersService, 'findByEmailWithPassword')
        .mockResolvedValue(mockUserWithPassword as any);
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockPublicUser);
      (jwtService.signAsync as jest.Mock).mockResolvedValue(token);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login(loginDto);

      expect(result).toEqual({
        accessToken: token,
        user: mockPublicUser,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      jest
        .spyOn(usersService, 'findByEmailWithPassword')
        .mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest
        .spyOn(usersService, 'findByEmailWithPassword')
        .mockResolvedValue(mockUserWithPassword as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should not reveal if email exists or password is wrong', async () => {
      const loginDtoWrongPassword = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest
        .spyOn(usersService, 'findByEmailWithPassword')
        .mockResolvedValue(mockUserWithPassword as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDtoWrongPassword)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
