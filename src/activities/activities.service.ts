import { Injectable } from '@nestjs/common';
import { ActivityListItemDto, ListActivitiesResponseDto } from './dto/list-activities.dto';

@Injectable()
export class ActivitiesService {
  async listActivities(userId: string): Promise<ListActivitiesResponseDto> {
    return {
      userData: {
        id: userId,
        name: 'Dr. Manuel Rocha',
        siapeId: '19827364-0',
        department: 'Ciencias da Computacao',
        workRegime: 'Dedicacao Exclusiva (DE)',
      },
      metadata: {
        institution: 'UNIVERSIDADE FEDERAL DO CONHECIMENTO',
        graduateOfficeTitle: 'PRO-REITORIA DE GRADUACAO E PESQUISA',
        documentLabel: 'DOCUMENTO PRELIMINAR',
        cycleLabel: 'Ciclo 2023/2024',
        issuedAtLabel: '24 de maio de 2024',
        cycleStatus: 'Em conformidade',
      },
      activities: this.mockActivities,
    };
  }

  private readonly mockActivities: readonly ActivityListItemDto[] = [
    {
      id: 'atv-teaching-1',
      title: 'Estruturas de Dados II (COMP0342)',
      description: 'Graduacao — 60 h teoricas / 30 h praticas',
      category: 'TEACHING',
      workloadHours: 90,
      score: 30,
      status: 'APPROVED',
      term: '2024.1',
      kind: 'Disciplina de graduacao',
    },
    {
      id: 'atv-teaching-2',
      title: 'Topicos avancados em IA (POS504)',
      description: 'Pos-graduacao — 45 h',
      category: 'TEACHING',
      workloadHours: 45,
      score: 20,
      status: 'APPROVED',
      term: '2024.1',
      kind: 'Disciplina de pos-graduacao',
    },
    {
      id: 'atv-research-1',
      title: 'Publicacao em periodico A1 — Nature Machine Intelligence',
      description: 'Artigo principal publicado em 2024',
      category: 'RESEARCH',
      workloadHours: 120,
      score: 45,
      status: 'APPROVED',
      term: '2024',
      kind: 'Publicacao Qualis A1',
    },
    {
      id: 'atv-research-2',
      title: 'Orientacao de doutorado concluida',
      description: 'Defesa aprovada no programa de Computacao',
      category: 'RESEARCH',
      workloadHours: 80,
      score: 25,
      status: 'APPROVED',
      term: '2024',
      kind: 'Orientacao',
    },
    {
      id: 'atv-outreach-1',
      title: 'Projeto de extensao em inclusao digital',
      description: 'Atuacao em comunidade com cursos de programacao',
      category: 'OUTREACH',
      workloadHours: 60,
      score: 18,
      status: 'APPROVED',
      term: '2024',
      kind: 'Projeto de extensao',
    },
    {
      id: 'atv-management-1',
      title: 'Coordenacao academica de curso',
      description: 'Gestao de grade e planejamento academico',
      category: 'MANAGEMENT',
      workloadHours: 120,
      score: 40,
      status: 'APPROVED',
      term: '2024',
      kind: 'Gestao academica',
    },
    {
      id: 'atv-pending-1',
      title: 'Banca de mestrado',
      description: 'Participacao em banca aguardando validacao',
      category: 'RESEARCH',
      workloadHours: 12,
      score: 8,
      status: 'PENDING',
      term: '2024',
      kind: 'Banca',
    },
    {
      id: 'atv-rejected-1',
      title: 'Evento sem comprovacao completa',
      description: 'Atividade com documentacao insuficiente',
      category: 'OUTREACH',
      workloadHours: 10,
      score: 3,
      status: 'REJECTED',
      term: '2024',
      kind: 'Evento',
    },
  ];
}
