import { Injectable, NotFoundException } from '@nestjs/common';
import { DashboardHomeDto } from './dto/dashboard-home.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class DashboardService {
  constructor(private readonly usersService: UsersService) {}

  async getHome(userId: string): Promise<DashboardHomeDto> {
    const user = await this.usersService.findDashboardProfileById(userId);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const currentLevel = user.currentLevel?.trim().toUpperCase() || 'IV';
    const normalizedCareerClass = this.normalizeCareerClass(user.careerClass);
    const currentLevelLabel = `${normalizedCareerClass} ${currentLevel}`;
    const nextLevelLabel =
      normalizedCareerClass === 'Titular' ? 'Titular II' : 'Titular I';

    return {
      displayName: user.name,
      roleLabel: currentLevelLabel,
      summary: `Boas-vindas, ${user.name}. Suas métricas de progressão estão atualizadas.`,
      score: {
        current: 1420,
        target: 2000,
      },
      career: {
        currentLevelLabel,
        nextLevelLabel,
        progressPercentage: 73,
        yearsInLevel: 3,
        yearsRequired: 4,
        qualisPublications: 12,
        qualisTarget: 15,
        supervisions: 5,
        supervisionsTarget: 4,
      },
      pillars: [
        {
          label: 'Ensino',
          score: 420,
          total: 420,
          percentage: 30,
          accent: '#5a54ea',
        },
        {
          label: 'Pesquisa',
          score: 680,
          total: 680,
          percentage: 48,
          accent: '#14b48b',
        },
        {
          label: 'Extensão',
          score: 210,
          total: 210,
          percentage: 15,
          accent: '#f59e0b',
        },
        {
          label: 'Gestão',
          score: 110,
          total: 110,
          percentage: 7,
          accent: '#9ca3af',
        },
      ],
      biennium: {
        cycleLabel: '2023 - 2024',
        completionPercentage: 84,
        departmentComparison:
          'Você está 12% à frente da média do departamento.',
      },
      notifications: [
        {
          title: 'Pendente: Relatório de Progressão',
          description:
            'O prazo para envio do relatório parcial encerra em 3 dias. Evite atrasos na sua contagem de pontos.',
          timestamp: 'Há 2 horas',
          icon: 'warning_amber',
          tone: 'warning',
        },
        {
          title: 'Artigo Validado',
          description:
            'Sua publicação no Journal of Academic Growth foi validada pela comissão. +40 pontos adicionados.',
          timestamp: 'Ontem',
          icon: 'verified',
          tone: 'success',
        },
        {
          title: 'Nova Orientação de Doutorado',
          description:
            'O discente Carlos Alberto selecionou você como orientador. Aceite a solicitação no sistema.',
          timestamp: '2 dias atrás',
          icon: 'school',
          tone: 'info',
        },
      ],
    };
  }

  private normalizeCareerClass(careerClass: string | null): string {
    const normalized = careerClass?.trim().toLowerCase() ?? '';

    switch (normalized) {
      case 'auxiliar':
        return 'Auxiliar';
      case 'assistente':
        return 'Assistente';
      case 'adjunto':
        return 'Adjunto';
      case 'associado':
        return 'Associado';
      case 'titular':
        return 'Titular';
      default:
        return 'Associado';
    }
  }
}
