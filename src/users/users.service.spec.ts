/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';

jest.mock('bcrypt');

describe('UsersService', () => {
  let usersService: UsersService;
  let prismaService: PrismaService;

  const createMockUser = (overrides = {}) => ({
    id: 'user-uuid',
    email: 'test@example.com',
    name: 'Test User',
    cpf: null,
    university: null,
    center: null,
    department: null,
    practiceAreas: [],
    careerClass: null,
    currentLevel: null,
    lastProgressionDate: null,
    acceptTerms: false,
    acceptLgpd: false,
    passwordHash: 'hashed-password',
    refreshTokenHash: null,
    resetPasswordTokenHash: null,
    resetPasswordExpiresAt: null,
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const mockPublicUser = createMockUser({ passwordHash: null });

  const mockUserWithPassword = createMockUser({
    passwordHash: 'hashed-password',
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    usersService = module.get(UsersService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user and return public user (no passwordHash)', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-password');
      (prismaService.user.create as jest.Mock).mockResolvedValueOnce({
        ...mockPublicUser,
        email: createUserDto.email,
      });

      const result = await usersService.create(createUserDto);

      expect(result).toEqual({
        ...mockPublicUser,
        email: createUserDto.email,
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(prismaService.user.create).toHaveBeenCalled();
    });

    it('should hash password during creation', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      jest
        .spyOn(prismaService.user, 'create')
        .mockResolvedValue(mockPublicUser);

      await usersService.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
    });

    it('should enforce USER role boundary', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
        role: Role.ADMIN, // Attempt to create as admin
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      jest.spyOn(prismaService.user, 'create').mockResolvedValue({
        ...mockPublicUser,
        role: Role.USER, // Should override to USER
      });

      const result = await usersService.create(createUserDto);

      // Verify role is set to USER despite request for ADMIN
      expect(result.role).toBe(Role.USER);
    });

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        name: 'New User',
        password: 'password123',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      jest
        .spyOn(prismaService.user, 'create')
        .mockRejectedValue(new ConflictException('Email ja cadastrado.'));

      await expect(usersService.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findById', () => {
    it('should return user by id without passwordHash', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        ...mockPublicUser,
      });

      const result = await usersService.findById('user-uuid');

      expect(result).toEqual(mockPublicUser);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(usersService.findById('nonexistent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmailWithPassword', () => {
    it('should return user with passwordHash for auth', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUserWithPassword);

      const result =
        await usersService.findByEmailWithPassword('test@example.com');

      expect(result).toEqual(mockUserWithPassword);
      expect(result).toHaveProperty('passwordHash');
    });

    it('should return null if user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      const result = await usersService.findByEmailWithPassword(
        'nonexistent@example.com',
      );

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users ordered by createdAt descending, no passwordHash', async () => {
      const mockUsers = [
        {
          ...mockPublicUser,
          id: 'uuid-1',
        },
        {
          ...mockPublicUser,
          id: 'uuid-2',
        },
      ];

      jest.spyOn(prismaService.user, 'findMany').mockResolvedValue(mockUsers);

      const result = await usersService.findAll();

      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
      result.forEach((user) => {
        expect(user).not.toHaveProperty('passwordHash');
      });
    });

    it('should return empty array if no users exist', async () => {
      jest.spyOn(prismaService.user, 'findMany').mockResolvedValue([]);

      const result = await usersService.findAll();

      expect(result).toEqual([]);
    });
  });
});
