import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ActivitiesService } from './activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { UploadedEvidenceFile } from './types/uploaded-evidence-file';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let prismaService: PrismaService;

  const mockActivity = {
    id: 'activity-1',
    userId: 'user-1',
    progressionCycleId: null,
    title: 'Pesquisa em IA',
    description: 'Texto descritivo da atividade',
    category: 'RESEARCH',
    workloadHours: 40,
    score: new Prisma.Decimal('15.50'),
    term: '2024.1',
    kind: 'Publicacao',
    status: 'PENDING',
    submittedAt: new Date('2026-01-10T10:00:00.000Z'),
    reviewedAt: null,
    reviewerId: null,
    rejectionReason: null,
    createdAt: new Date('2026-01-10T10:00:00.000Z'),
    updatedAt: new Date('2026-01-10T10:00:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: PrismaService,
          useValue: {
            activity: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            activityEvidence: {
              create: jest.fn(),
              findFirst: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(ActivitiesService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates an activity for the authenticated user only', async () => {
    const dto: CreateActivityDto = {
      title: 'Pesquisa em IA',
      description: 'Texto descritivo da atividade',
      category: 'RESEARCH',
      workloadHours: 40,
      score: 15.5,
      term: '2024.1',
      kind: 'Publicacao',
    };

    (
      prismaService as unknown as { activity: { create: jest.Mock } }
    ).activity.create.mockResolvedValueOnce(mockActivity);

    const result = await service.create('user-1', dto);

    expect(
      (prismaService as unknown as { activity: { create: jest.Mock } }).activity
        .create,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          title: dto.title,
          description: dto.description,
          category: dto.category,
          workloadHours: dto.workloadHours,
          score: expect.any(Prisma.Decimal),
          term: dto.term,
          kind: dto.kind,
        }),
      }),
    );
    expect(result.score).toBe(dto.score);
  });

  it('returns paginated user activities ordered by newest first', async () => {
    (
      prismaService as unknown as { activity: { findMany: jest.Mock } }
    ).activity.findMany.mockResolvedValueOnce([mockActivity]);
    (
      prismaService as unknown as { activity: { count: jest.Mock } }
    ).activity.count.mockResolvedValueOnce(1);

    const result = await service.findAllPaginated('user-1', {
      page: 1,
      pageSize: 10,
    });

    expect(
      (prismaService as unknown as { activity: { findMany: jest.Mock } })
        .activity.findMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      }),
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.score).toBe(15.5);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('applies category, status, search and term filters when listing activities', async () => {
    (
      prismaService as unknown as { activity: { findMany: jest.Mock } }
    ).activity.findMany.mockResolvedValueOnce([]);
    (
      prismaService as unknown as { activity: { count: jest.Mock } }
    ).activity.count.mockResolvedValueOnce(0);

    await service.findAllPaginated('user-1', {
      page: 2,
      pageSize: 5,
      category: 'RESEARCH',
      status: 'PENDING',
      term: '2024',
      search: 'IA',
    });

    expect(
      (prismaService as unknown as { activity: { findMany: jest.Mock } })
        .activity.findMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-1',
          category: 'RESEARCH',
          status: 'PENDING',
          term: { startsWith: '2024' },
          OR: [
            { title: { contains: 'IA', mode: 'insensitive' } },
            { description: { contains: 'IA', mode: 'insensitive' } },
          ],
        },
        skip: 5,
        take: 5,
      }),
    );
  });

  it('throws NotFoundException when updating an activity that does not belong to the user', async () => {
    (
      prismaService as unknown as { activity: { findFirst: jest.Mock } }
    ).activity.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.update('user-1', 'activity-1', {
        title: 'Novo titulo',
      } as UpdateActivityDto),
    ).rejects.toThrow(NotFoundException);
  });

  it('attaches evidence to an owned activity', async () => {
    (
      prismaService as unknown as { activity: { findFirst: jest.Mock } }
    ).activity.findFirst.mockResolvedValueOnce(mockActivity);
    (
      prismaService as unknown as { activityEvidence: { create: jest.Mock } }
    ).activityEvidence.create.mockResolvedValueOnce({
      id: 'evidence-1',
      activityId: mockActivity.id,
      type: 'FILE',
      filename: 'stored.pdf',
      originalName: 'evidence.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      storagePath: 'uploads/stored.pdf',
      externalUrl: null,
      uploadedById: 'user-1',
      createdAt: new Date('2026-01-10T10:00:00.000Z'),
    });

    const result = await service.uploadEvidence('user-1', 'activity-1', {
      originalname: 'evidence.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      filename: 'stored.pdf',
      buffer: Buffer.from('pdf'),
    } as UploadedEvidenceFile);

    expect(result.originalName).toBe('evidence.pdf');
    expect(
      (prismaService as unknown as { activityEvidence: { create: jest.Mock } })
        .activityEvidence.create,
    ).toHaveBeenCalled();
  });

  it('rejects evidence deletion when the evidence does not belong to the user', async () => {
    (
      prismaService as unknown as { activityEvidence: { findFirst: jest.Mock } }
    ).activityEvidence.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.deleteEvidence('user-1', 'evidence-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects unsupported files during upload', async () => {
    (
      prismaService as unknown as { activity: { findFirst: jest.Mock } }
    ).activity.findFirst.mockResolvedValueOnce(mockActivity);

    await expect(
      service.uploadEvidence('user-1', 'activity-1', {
        originalname: 'evil.exe',
        mimetype: 'application/x-msdownload',
        size: 100,
      } as UploadedEvidenceFile),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns a score estimate based on category and workload', async () => {
    const result = await service.estimateScore({
      category: 'RESEARCH',
      workloadHours: 40,
    });

    expect(result.baseCategory).toBe(15);
    expect(result.workloadFactor).toBe(2.5);
    expect(result.totalImpact).toBe(17.5);
  });
});
