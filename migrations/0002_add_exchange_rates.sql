-- Add exchange rate columns to gold_rates table
ALTER TABLE "gold_rates" ADD COLUMN "gold_22k_exchange" real NOT NULL DEFAULT 0;
ALTER TABLE "gold_rates" ADD COLUMN "gold_18k_exchange" real NOT NULL DEFAULT 0;
ALTER TABLE "gold_rates" ADD COLUMN "silver_per_kg_exchange" real NOT NULL DEFAULT 0;

-- Add exchange rate percentage settings to rate_settings table
ALTER TABLE "rate_settings" ADD COLUMN "perc_22k_exchange" real DEFAULT 0.91;
ALTER TABLE "rate_settings" ADD COLUMN "perc_18k_exchange" real DEFAULT 0.85;
ALTER TABLE "rate_settings" ADD COLUMN "silver_exchange_offset" real DEFAULT -3000;
