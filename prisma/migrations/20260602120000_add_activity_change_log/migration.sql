-- CreateTable
CREATE TABLE "activity_change_logs" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "field_label" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "changed_by_id" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_activity_change_log" ON "activity_change_logs"("activity_id", "changed_at");

-- AddForeignKey
ALTER TABLE "activity_change_logs" ADD CONSTRAINT "activity_change_logs_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_change_logs" ADD CONSTRAINT "activity_change_logs_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
