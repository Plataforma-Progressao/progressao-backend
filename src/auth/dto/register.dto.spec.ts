import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  it('should reject practice areas with empty string entries', async () => {
    const dto = plainToInstance(RegisterDto, {
      fullName: 'Teste Usuario',
      cpf: '12345678901',
      email: 'teste@example.com',
      university: 'UFMG',
      center: 'ICEX',
      department: 'DCC',
      practiceAreas: ['backend', '   '],
      careerClass: 'Adjunto',
      currentLevel: 'I',
      lastProgressionDate: '2025-02-10',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      acceptTerms: true,
      acceptLgpd: true,
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const practiceAreasError = errors.find(
      (error) => error.property === 'practiceAreas',
    );
    expect(practiceAreasError).toBeDefined();
  });
});
