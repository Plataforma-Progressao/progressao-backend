-- AlterTable
ALTER TABLE "users" ADD COLUMN     "siape_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_siape_id_key" ON "users"("siape_id");
