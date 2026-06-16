export interface ActivityEvidenceDto {
  readonly id: string;
  readonly originalName: string;
  readonly mimeType: string | null;
  readonly sizeBytes: number;
  readonly createdAt: string;
}
