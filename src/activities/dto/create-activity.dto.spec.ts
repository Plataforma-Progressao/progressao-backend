import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateActivityDto } from './create-activity.dto';

describe('CreateActivityDto', () => {
  it('validates the required public fields', async () => {
    const dto = plainToInstance(CreateActivityDto, {
      title: 'Pesquisa em aprendizagem de máquina',
      description:
        'Atividade vinculada ao ciclo atual com documentação completa.',
      category: 'RESEARCH',
      workloadHours: 40,
      score: 15.5,
      term: '2024.1',
      kind: 'Publicacao',
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('rejects invalid payloads and keeps ownership fields out of the contract', async () => {
    const dto = plainToInstance(CreateActivityDto, {
      title: 'Curta',
      description: 'curta',
      category: 'INVALID',
      workloadHours: -1,
      score: 'not-a-number',
      userId: 'should-not-be-accepted',
    });

    const errors = await validate(dto);
    const errorProperties = errors.map((error) => error.property);

    expect(errorProperties).toEqual(
      expect.arrayContaining([
        'title',
        'description',
        'category',
        'workloadHours',
        'score',
      ]),
    );
    expect(errorProperties).not.toContain('userId');
  });
});
