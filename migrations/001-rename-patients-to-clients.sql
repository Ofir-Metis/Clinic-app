-- Migration: Rename patients table to clients
-- Date: 2025-10-31
-- Description: Renames the patients table to clients as part of transitioning
--              from healthcare terminology to coaching terminology

BEGIN;

-- Rename the main table
ALTER TABLE IF EXISTS patients RENAME TO clients;

-- Rename indexes
ALTER INDEX IF EXISTS patients_pkey RENAME TO clients_pkey;
ALTER INDEX IF EXISTS patients_email_key RENAME TO clients_email_key;
ALTER INDEX IF EXISTS idx_patients_email RENAME TO idx_clients_email;
ALTER INDEX IF EXISTS idx_patients_therapist_id RENAME TO idx_clients_coach_id;
ALTER INDEX IF EXISTS idx_patients_created_at RENAME TO idx_clients_created_at;

-- Rename sequences if they exist
ALTER SEQUENCE IF EXISTS patients_id_seq RENAME TO clients_id_seq;

-- Update column name therapistId to coachId if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'clients'
        AND column_name = 'therapistId'
    ) THEN
        ALTER TABLE clients RENAME COLUMN "therapistId" TO "coachId";
    END IF;

    -- Also check for snake_case variant
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'clients'
        AND column_name = 'therapist_id'
    ) THEN
        ALTER TABLE clients RENAME COLUMN therapist_id TO coach_id;
    END IF;
END $$;

-- Log the migration
INSERT INTO migrations (name, executed_at)
VALUES ('001-rename-patients-to-clients', NOW())
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Rollback script (comment this out, save separately if needed)
-- BEGIN;
-- ALTER TABLE clients RENAME TO patients;
-- ALTER INDEX clients_pkey RENAME TO patients_pkey;
-- ALTER INDEX clients_email_key RENAME TO patients_email_key;
-- ALTER INDEX idx_clients_email RENAME TO idx_patients_email;
-- ALTER INDEX idx_clients_coach_id RENAME TO idx_patients_therapist_id;
-- ALTER INDEX idx_clients_created_at RENAME TO idx_patients_created_at;
-- ALTER SEQUENCE clients_id_seq RENAME TO patients_id_seq;
-- ALTER TABLE clients RENAME COLUMN "coachId" TO "therapistId";
-- DELETE FROM migrations WHERE name = '001-rename-patients-to-clients';
-- COMMIT;
