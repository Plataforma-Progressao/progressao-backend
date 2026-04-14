/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums/role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockExecutionContext = (user: any, requiredRoles: Role[] | null) => {
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user,
        }),
      }),
    } as unknown as ExecutionContext;

    // Mock reflector to return requiredRoles
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(requiredRoles || undefined);

    return context;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get(RolesGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access if no roles are required', () => {
      const user = {
        sub: 'user-1',
        email: 'user@example.com',
        role: Role.USER,
      };
      const context = mockExecutionContext(user, null);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow USER role when USER is required', () => {
      const user = {
        sub: 'user-1',
        email: 'user@example.com',
        role: Role.USER,
      };
      const context = mockExecutionContext(user, [Role.USER]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow ADMIN role when ADMIN is required', () => {
      const user = {
        sub: 'user-1',
        email: 'admin@example.com',
        role: Role.ADMIN,
      };
      const context = mockExecutionContext(user, [Role.ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny USER role when ADMIN is required', () => {
      const user = {
        sub: 'user-1',
        email: 'user@example.com',
        role: Role.USER,
      };
      const context = mockExecutionContext(user, [Role.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny ADMIN role when USER is required', () => {
      const user = {
        sub: 'user-1',
        email: 'admin@example.com',
        role: Role.ADMIN,
      };
      const context = mockExecutionContext(user, [Role.USER]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow multiple acceptable roles', () => {
      const userAsUser = {
        sub: 'user-1',
        email: 'user@example.com',
        role: Role.USER,
      };
      const contextUser = mockExecutionContext(userAsUser, [
        Role.USER,
        Role.ADMIN,
      ]);

      const resultUser = guard.canActivate(contextUser);
      expect(resultUser).toBe(true);

      jest.clearAllMocks();

      const userAsAdmin = {
        sub: 'user-2',
        email: 'admin@example.com',
        role: Role.ADMIN,
      };
      const contextAdmin = mockExecutionContext(userAsAdmin, [
        Role.USER,
        Role.ADMIN,
      ]);

      const resultAdmin = guard.canActivate(contextAdmin);
      expect(resultAdmin).toBe(true);
    });

    it('should throw ForbiddenException with appropriate message', () => {
      const user = {
        sub: 'user-1',
        email: 'user@example.com',
        role: Role.USER,
      };
      const context = mockExecutionContext(user, [Role.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
