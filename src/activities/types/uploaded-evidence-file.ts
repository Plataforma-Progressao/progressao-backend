export interface UploadedEvidenceFile {
  readonly originalname: string;
  readonly mimetype: string;
  readonly size: number;
  readonly filename?: string;
}
