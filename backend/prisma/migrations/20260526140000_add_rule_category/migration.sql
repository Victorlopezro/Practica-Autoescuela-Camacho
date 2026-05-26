-- Migration: Add category column to scheduling_rules
-- Separates evaluation rules from generation rules

ALTER TABLE "scheduling_rules"
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'evaluation';
