-- Atividades sao aprovadas automaticamente na criacao (sem fluxo de revisao manual).
ALTER TABLE "activities" ALTER COLUMN "status" SET DEFAULT 'APPROVED';

UPDATE "activities"
SET
  "status" = 'APPROVED',
  "reviewed_at" = COALESCE("reviewed_at", "submitted_at", "created_at")
WHERE "status" IN ('PENDING', 'DRAFT');
