-- Alter workload_hours to support fractional hours (e.g. 1.5 for 1h30min)
ALTER TABLE "activities"
ALTER COLUMN "workload_hours" TYPE DECIMAL(10, 2)
USING "workload_hours"::decimal;
