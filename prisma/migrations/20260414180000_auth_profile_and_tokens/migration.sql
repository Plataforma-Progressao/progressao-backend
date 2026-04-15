-- AlterTable
ALTER TABLE "users"
ADD COLUMN "cpf" TEXT,
ADD COLUMN "university" TEXT,
ADD COLUMN "center" TEXT,
ADD COLUMN "department" TEXT,
ADD COLUMN "practiceAreas" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
ADD COLUMN "career_class" TEXT,
ADD COLUMN "current_level" TEXT,
ADD COLUMN "last_progression_date" TIMESTAMP(3),
ADD COLUMN "accept_terms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "accept_lgpd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "refresh_token_hash" TEXT,
ADD COLUMN "reset_password_token_hash" TEXT,
ADD COLUMN "reset_password_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");
