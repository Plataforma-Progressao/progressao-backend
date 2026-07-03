export type ActivityCategory = 'TEACHING' | 'RESEARCH' | 'OUTREACH' | 'MANAGEMENT';
export type ActivityStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface ReportEvidenceDto {
  readonly id: string;
  readonly originalName: string;
  readonly mimeType: string | null;
}

export interface ActivityListItemDto {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: ActivityCategory;
  readonly workloadHours: number;
  readonly score: number;
  readonly status: ActivityStatus;
  readonly term: string;
  readonly kind: string;
  readonly rejectionReason?: string | null;
  readonly submittedAt?: string | null;
  readonly evidences?: readonly ReportEvidenceDto[];
}

export interface ReportTeacherProfileDto {
  readonly id: string;
  readonly name: string;
  readonly siapeId: string;
  readonly department: string;
  readonly workRegime: string;
}

export interface ReportInstitutionMetadataDto {
  readonly institution: string;
  readonly graduateOfficeTitle: string;
  readonly documentLabel: string;
  readonly cycleLabel: string;
  readonly issuedAtLabel: string;
  readonly cycleStatus: string;
}

export interface ListActivitiesResponseDto {
  readonly userData: ReportTeacherProfileDto;
  readonly metadata: ReportInstitutionMetadataDto;
  readonly activities: readonly ActivityListItemDto[];
}
