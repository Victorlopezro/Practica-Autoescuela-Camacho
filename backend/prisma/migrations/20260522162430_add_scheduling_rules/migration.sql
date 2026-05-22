-- Add SchedulingRule model for rule engine

-- CreateTable
CREATE TABLE "scheduling_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "natural_language" TEXT NOT NULL,
    "structured_rules" JSONB,
    "rule_type" TEXT NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'block',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "applies_to" JSONB,
    "created_by_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduling_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduling_rules_enabled_deleted_at_priority_idx" ON "scheduling_rules"("enabled", "deleted_at", "priority");

-- AddForeignKey
ALTER TABLE "scheduling_rules" ADD CONSTRAINT "scheduling_rules_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
