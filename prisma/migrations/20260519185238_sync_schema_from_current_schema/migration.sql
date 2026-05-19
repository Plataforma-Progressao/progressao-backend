-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('TEACHING', 'RESEARCH', 'OUTREACH', 'MANAGEMENT');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('FILE', 'LINK');

-- CreateEnum
CREATE TYPE "ChecklistItemStatus" AS ENUM ('PENDING', 'ATTENTION', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationTone" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "work_regime" TEXT;

-- CreateTable
CREATE TABLE "progression_cycles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "status_label" TEXT,
    "issued_at_label" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progression_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "progression_cycle_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ActivityCategory" NOT NULL,
    "workload_hours" INTEGER NOT NULL,
    "score" DECIMAL(10,2) NOT NULL,
    "term" TEXT,
    "kind" TEXT,
    "status" "ActivityStatus" NOT NULL DEFAULT 'PENDING',
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewer_id" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_evidences" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL DEFAULT 'FILE',
    "file_name" TEXT,
    "original_name" TEXT,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "storage_path" TEXT,
    "external_url" TEXT,
    "uploaded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_status_history" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "from_status" "ActivityStatus" NOT NULL,
    "to_status" "ActivityStatus" NOT NULL,
    "note" TEXT,
    "changed_by_id" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_template_items" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "required_for" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_checklist_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "progression_cycle_id" TEXT,
    "template_item_id" TEXT NOT NULL,
    "status" "ChecklistItemStatus" NOT NULL DEFAULT 'PENDING',
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewer_id" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "icon" TEXT,
    "tone" "NotificationTone" NOT NULL DEFAULT 'INFO',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "progression_cycle_id" TEXT,
    "title" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_score_summaries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "progression_cycle_id" TEXT,
    "score_current" INTEGER NOT NULL DEFAULT 0,
    "score_target" INTEGER NOT NULL DEFAULT 2000,
    "teaching_score" INTEGER NOT NULL DEFAULT 0,
    "research_score" INTEGER NOT NULL DEFAULT 0,
    "outreach_score" INTEGER NOT NULL DEFAULT 0,
    "management_score" INTEGER NOT NULL DEFAULT 0,
    "progress_percentage" INTEGER NOT NULL DEFAULT 0,
    "years_in_level" INTEGER NOT NULL DEFAULT 0,
    "years_required" INTEGER NOT NULL DEFAULT 4,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_score_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_progression_cycle_user_active" ON "progression_cycles"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_activity_user_status" ON "activities"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_activity_cycle" ON "activities"("progression_cycle_id");

-- CreateIndex
CREATE INDEX "idx_activity_reviewer" ON "activities"("reviewer_id");

-- CreateIndex
CREATE INDEX "idx_evidence_activity" ON "activity_evidences"("activity_id");

-- CreateIndex
CREATE INDEX "idx_evidence_uploader" ON "activity_evidences"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "idx_activity_status_history" ON "activity_status_history"("activity_id", "changed_at");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_template_items_code_key" ON "checklist_template_items"("code");

-- CreateIndex
CREATE INDEX "idx_checklist_user_status" ON "user_checklist_items"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_checklist_user_cycle_item" ON "user_checklist_items"("user_id", "progression_cycle_id", "template_item_id");

-- CreateIndex
CREATE INDEX "idx_notification_user_read" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "idx_report_snapshot_user_date" ON "report_snapshots"("user_id", "generated_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_score_cycle" ON "user_score_summaries"("user_id", "progression_cycle_id");

-- AddForeignKey
ALTER TABLE "progression_cycles" ADD CONSTRAINT "progression_cycles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_progression_cycle_id_fkey" FOREIGN KEY ("progression_cycle_id") REFERENCES "progression_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_evidences" ADD CONSTRAINT "activity_evidences_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_evidences" ADD CONSTRAINT "activity_evidences_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_status_history" ADD CONSTRAINT "activity_status_history_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_status_history" ADD CONSTRAINT "activity_status_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_checklist_items" ADD CONSTRAINT "user_checklist_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_checklist_items" ADD CONSTRAINT "user_checklist_items_progression_cycle_id_fkey" FOREIGN KEY ("progression_cycle_id") REFERENCES "progression_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_checklist_items" ADD CONSTRAINT "user_checklist_items_template_item_id_fkey" FOREIGN KEY ("template_item_id") REFERENCES "checklist_template_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_checklist_items" ADD CONSTRAINT "user_checklist_items_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_snapshots" ADD CONSTRAINT "report_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_snapshots" ADD CONSTRAINT "report_snapshots_progression_cycle_id_fkey" FOREIGN KEY ("progression_cycle_id") REFERENCES "progression_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_score_summaries" ADD CONSTRAINT "user_score_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_score_summaries" ADD CONSTRAINT "user_score_summaries_progression_cycle_id_fkey" FOREIGN KEY ("progression_cycle_id") REFERENCES "progression_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
