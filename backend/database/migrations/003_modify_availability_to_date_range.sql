-- Migration: Replace availability ENUM with date range for automob profiles
-- Date: 2025-01-04

-- Add new date range columns
ALTER TABLE automob_profiles 
ADD COLUMN availability_start_date DATE NULL AFTER longitude,
ADD COLUMN availability_end_date DATE NULL AFTER availability_start_date;
