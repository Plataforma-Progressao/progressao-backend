-- AlterTable
ALTER TABLE "notifications" ADD COLUMN "kind" TEXT;

-- CreateTable
CREATE TABLE "barema_configs" (
    "id" TEXT NOT NULL,
    "university" TEXT,
    "score_target" INTEGER NOT NULL DEFAULT 2000,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barema_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barema_category_rules" (
    "id" TEXT NOT NULL,
    "barema_config_id" TEXT NOT NULL,
    "category" "ActivityCategory" NOT NULL,
    "base_score" DECIMAL(10,2) NOT NULL,
    "workload_multiplier" DECIMAL(10,4) NOT NULL DEFAULT 0.0625,
    "ceiling_score" DECIMAL(10,2) NOT NULL,
    "minimum_target" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barema_category_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barema_activity_rules" (
    "id" TEXT NOT NULL,
    "barema_config_id" TEXT NOT NULL,
    "category" "ActivityCategory" NOT NULL,
    "kind" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fixed_score" DECIMAL(10,2),
    "workload_multiplier" DECIMAL(10,4),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barema_activity_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "barema_configs_university_key" ON "barema_configs"("university");

-- CreateIndex
CREATE UNIQUE INDEX "barema_category_rules_barema_config_id_category_key" ON "barema_category_rules"("barema_config_id", "category");

-- CreateIndex
CREATE INDEX "barema_activity_rules_barema_config_id_is_active_idx" ON "barema_activity_rules"("barema_config_id", "is_active");

-- AddForeignKey
ALTER TABLE "barema_category_rules" ADD CONSTRAINT "barema_category_rules_barema_config_id_fkey" FOREIGN KEY ("barema_config_id") REFERENCES "barema_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barema_activity_rules" ADD CONSTRAINT "barema_activity_rules_barema_config_id_fkey" FOREIGN KEY ("barema_config_id") REFERENCES "barema_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
