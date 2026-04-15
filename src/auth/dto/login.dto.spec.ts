import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  it('should normalize email with trim + lowercase', async () => {
    const dto = plainToInstance(LoginDto, {
      email: '  USER@Example.COM  ',
      password: 'Password@123',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.email).toBe('user@example.com');
  });

  it('should reject password containing only spaces', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'user@example.com',
      password: '          ',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const passwordError = errors.find((error) => error.property === 'password');
    expect(passwordError).toBeDefined();
  });
});
