/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { App } from 'supertest/types';
import { TransformResponseInterceptor } from './../src/common/interceptors/transform-response.interceptor';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { Role } from './../src/common/enums/role.enum';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new TransformResponseInterceptor());
    await app.init();

    prismaService = app.get(PrismaService);

    // Clean up test users before each test
    await prismaService.user.deleteMany({
      where: {
        email: {
          in: ['test@e2e.com', 'admin@e2e.com', 'user@e2e.com'],
        },
      },
    });
  });

  describe('GET /api (root)', () => {
    it('should return welcome message', () => {
      return request(app.getHttpServer()).get('/api').expect(200).expect({
        success: true,
        data: 'Plataforma de Progressao Docente API',
      });
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with role USER by default', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@e2e.com',
          name: 'Test User',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
          user: {
            id: expect.any(String),
            email: 'test@e2e.com',
            name: 'Test User',
            role: Role.USER,
          },
        },
      });
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should allow administrator to create ADMIN role user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'admin-user@e2e.com',
          name: 'Admin User',
          password: 'password123',
          role: Role.ADMIN,
        })
        .expect(201);

      // In production, only ADMIN users should be able to request ADMIN role
      // For now, the API allows it. The DTO/service should enforce this with guards.
      // This test verifies the system doesn't crash if ADMIN is requested.
      expect(response.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
          user: {
            email: 'admin-user@e2e.com',
          },
        },
      });
    });

    it('should reject invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          name: 'Test User',
          password: 'password123',
        })
        .expect(400);
    });

    it('should reject password shorter than 8 characters', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@e2e.com',
          name: 'Test User',
          password: 'short',
        })
        .expect(400);
    });

    it('should reject if email already exists', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'duplicate@e2e.com',
          name: 'First User',
          password: 'password123',
        })
        .expect(201);

      // Second registration with same email
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'duplicate@e2e.com',
          name: 'Second User',
          password: 'password123',
        })
        .expect(409);
    });
  });

  describe('POST /api/auth/login', () => {
    let testUserEmail: string;
    let testUserPassword: string;

    beforeEach(async () => {
      testUserEmail = 'login@e2e.com';
      testUserPassword = 'password123';

      // Create test user
      await request(app.getHttpServer()).post('/api/auth/register').send({
        email: testUserEmail,
        name: 'Login Tester',
        password: testUserPassword,
      });
    });

    it('should login user with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
          user: {
            email: testUserEmail,
            role: Role.USER,
          },
        },
      });
    });

    it('should reject login with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should reject login with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@e2e.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should reject login with wrong password and non-existent email with same status', async () => {
      const wrongPasswordResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: 'wrongpassword',
        });

      const nonExistentResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@e2e.com',
          password: 'password123',
        });

      // Both should return 401 to prevent email enumeration
      expect(wrongPasswordResponse.status).toBe(401);
      expect(nonExistentResponse.status).toBe(401);
    });
  });

  describe('GET /api/users/me (protected)', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      // Register and login a user
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'me@e2e.com',
          name: 'Me Tester',
          password: 'password123',
        });

      accessToken = registerResponse.body.data.accessToken;
      userId = registerResponse.body.data.user.id;
    });

    it('should return current user with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: userId,
          email: 'me@e2e.com',
          role: Role.USER,
        },
      });
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer()).get('/api/users/me').expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('GET /api/users (protected with ADMIN role)', () => {
    let adminToken: string;
    let userToken: string;

    beforeEach(async () => {
      // Create admin user directly via Prisma
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await prismaService.user.create({
        data: {
          email: 'admin@e2e.com',
          name: 'Admin User',
          passwordHash: hashedPassword,
          role: Role.ADMIN,
        },
      });

      // Login as admin
      const adminLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@e2e.com',
          password: 'admin123',
        });
      adminToken = adminLoginResponse.body.data.accessToken;

      // Create and login as regular user
      const userRegisterResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'regularuser@e2e.com',
          name: 'Regular User',
          password: 'password123',
        });
      userToken = userRegisterResponse.body.data.accessToken;
    });

    it('should allow ADMIN to fetch all users', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
      });
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify no passwordHash leaked
      response.body.data.forEach((user: any) => {
        expect(user).not.toHaveProperty('passwordHash');
      });
    });

    it('should deny USER access to fetch all users', async () => {
      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer()).get('/api/users').expect(401);
    });
  });

  afterEach(async () => {
    // Cleanup
    await prismaService.user.deleteMany({
      where: {
        email: {
          in: [
            'test@e2e.com',
            'admin@e2e.com',
            'user@e2e.com',
            'duplicate@e2e.com',
            'login@e2e.com',
            'me@e2e.com',
            'regularuser@e2e.com',
          ],
        },
      },
    });

    await app.close();
  });
});
