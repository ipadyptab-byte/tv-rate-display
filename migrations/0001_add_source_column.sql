-- Add source column to gold_rates table
ALTER TABLE "gold_rates" ADD COLUMN "source" text DEFAULT 'api';
