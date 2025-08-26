-- Fix the profiles table to use proper foreign key relationship with departments
-- Change department column from text to uuid and add foreign key constraint

-- First, update any existing text department values to null (since we can't map text to uuid automatically)
UPDATE profiles SET department = NULL WHERE department IS NOT NULL;

-- Drop the existing department column
ALTER TABLE profiles DROP COLUMN IF EXISTS department;

-- Add new department_id column with proper foreign key relationship
ALTER TABLE profiles ADD COLUMN department_id uuid REFERENCES departments(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON profiles(department_id);
