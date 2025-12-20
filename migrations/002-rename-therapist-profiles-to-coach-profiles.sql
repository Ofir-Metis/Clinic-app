-- Migration: Rename therapist_profiles table to coach_profiles
-- Date: 2025-10-31
-- Description: Renames the therapist_profiles table to coach_profiles as part of
--              transitioning from healthcare terminology to coaching terminology

BEGIN;

-- Rename the main table
ALTER TABLE IF EXISTS therapist_profiles RENAME TO coach_profiles;

-- Rename indexes
ALTER INDEX IF EXISTS therapist_profiles_pkey RENAME TO coach_profiles_pkey;
ALTER INDEX IF EXISTS therapist_profiles_user_id_key RENAME TO coach_profiles_user_id_key;
ALTER INDEX IF EXISTS idx_therapist_profiles_user_id RENAME TO idx_coach_profiles_user_id;
ALTER INDEX IF EXISTS idx_therapist_profiles_is_active RENAME TO idx_coach_profiles_is_active;
ALTER INDEX IF EXISTS idx_therapist_profiles_specializations RENAME TO idx_coach_profiles_specializations;

-- Rename sequences if they exist
ALTER SEQUENCE IF EXISTS therapist_profiles_id_seq RENAME TO coach_profiles_id_seq;

-- Update foreign keys in other tables that reference therapist_profiles
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    -- Find all foreign keys pointing to the old table name
    FOR fk_record IN
        SELECT
            tc.constraint_name,
            tc.table_name
        FROM information_schema.table_constraints AS tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.constraint_name LIKE '%therapist%'
    LOOP
        -- Rename the constraint
        EXECUTE format('ALTER TABLE %I RENAME CONSTRAINT %I TO %I',
            fk_record.table_name,
            fk_record.constraint_name,
            replace(fk_record.constraint_name, 'therapist', 'coach')
        );
    END LOOP;
END $$;

-- Update columns that reference therapists in foreign keys
DO $$
BEGIN
    -- Update therapistId columns to coachId in related tables
    -- (Add specific tables as needed)

    -- Example for appointments table if it exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'appointments'
        AND column_name = 'therapistId'
    ) THEN
        ALTER TABLE appointments RENAME COLUMN "therapistId" TO "coachId";
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'appointments'
        AND column_name = 'therapist_id'
    ) THEN
        ALTER TABLE appointments RENAME COLUMN therapist_id TO coach_id;
    END IF;

    -- Example for client_therapist_payment table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_therapist_payment') THEN
        ALTER TABLE client_therapist_payment RENAME TO client_coach_payment;
    END IF;

    -- Example for therapist_pricing table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'therapist_pricing') THEN
        ALTER TABLE therapist_pricing RENAME TO coach_pricing;
    END IF;
END $$;

-- Log the migration
INSERT INTO migrations (name, executed_at)
VALUES ('002-rename-therapist-profiles-to-coach-profiles', NOW())
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Rollback script (comment this out, save separately if needed)
-- BEGIN;
-- ALTER TABLE coach_profiles RENAME TO therapist_profiles;
-- ALTER INDEX coach_profiles_pkey RENAME TO therapist_profiles_pkey;
-- ALTER INDEX coach_profiles_user_id_key RENAME TO therapist_profiles_user_id_key;
-- ALTER INDEX idx_coach_profiles_user_id RENAME TO idx_therapist_profiles_user_id;
-- ALTER INDEX idx_coach_profiles_is_active RENAME TO idx_therapist_profiles_is_active;
-- ALTER INDEX idx_coach_profiles_specializations RENAME TO idx_therapist_profiles_specializations;
-- ALTER SEQUENCE coach_profiles_id_seq RENAME TO therapist_profiles_id_seq;
-- ALTER TABLE appointments RENAME COLUMN "coachId" TO "therapistId";
-- ALTER TABLE client_coach_payment RENAME TO client_therapist_payment;
-- ALTER TABLE coach_pricing RENAME TO therapist_pricing;
-- DELETE FROM migrations WHERE name = '002-rename-therapist-profiles-to-coach-profiles';
-- COMMIT;
