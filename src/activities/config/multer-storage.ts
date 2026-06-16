import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import type { Request } from 'express';
import { extname, join } from 'path';

const UPLOADS_DIR = join(process.cwd(), 'uploads');

export function ensureUploadsDirectory(): string {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  return UPLOADS_DIR;
}

export const activityEvidenceStorage = diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    callback: (error: Error | null, destination: string) => void,
  ) => {
    callback(null, ensureUploadsDirectory());
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void,
  ) => {
    const extension = extname(file.originalname).toLowerCase();
    callback(null, `${randomUUID()}${extension}`);
  },
});

export function resolveEvidenceAbsolutePath(storagePath: string | null): string | null {
  if (!storagePath?.trim()) {
    return null;
  }

  if (storagePath.startsWith('uploads/')) {
    return join(process.cwd(), storagePath);
  }

  return join(ensureUploadsDirectory(), storagePath);
}
