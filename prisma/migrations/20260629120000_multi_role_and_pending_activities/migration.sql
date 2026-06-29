-- Add EVALUATOR role
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'EVALUATOR';

-- Migrate single role to roles array
ALTER TABLE "users" ADD COLUMN "roles" "Role"[] DEFAULT ARRAY['USER']::"Role"[];

UPDATE "users" SET "roles" = ARRAY["role"]::"Role"[];

ALTER TABLE "users" ALTER COLUMN "roles" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "roles" SET DEFAULT ARRAY['USER']::"Role"[];

ALTER TABLE "users" DROP COLUMN "role";

-- New activities default to PENDING
ALTER TABLE "activities" ALTER COLUMN "status" SET DEFAULT 'PENDING';
