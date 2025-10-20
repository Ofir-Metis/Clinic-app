-- Create patient records with therapist relationships
-- Use actual therapist IDs from the user table

-- First, let's create patients with therapist assignments
INSERT INTO patients ("firstName", "lastName", email, phone, "therapistId", preferences, "whatsappOptIn")
SELECT 
    SPLIT_PART(u.name, ' ', 1) as "firstName",
    SPLIT_PART(u.name, ' ', 2) as "lastName", 
    u.email,
    '+1-555-' || LPAD((RANDOM() * 9999)::INT::TEXT, 4, '0') as phone,
    (SELECT id FROM "user" WHERE 'coach' = ANY(roles) ORDER BY RANDOM() LIMIT 1) as "therapistId",
    '{"goals": ["Personal Growth", "Stress Management"], "sessionLength": 50, "preferredTime": "afternoon"}'::jsonb as preferences,
    CASE WHEN RANDOM() > 0.5 THEN true ELSE false END as "whatsappOptIn"
FROM "user" u
WHERE 'client' = ANY(u.roles);

-- Create additional patient records for clients who have multiple therapists
INSERT INTO patients ("firstName", "lastName", email, phone, "therapistId", preferences, "whatsappOptIn")
SELECT 
    SPLIT_PART(u.name, ' ', 1) as "firstName",
    SPLIT_PART(u.name, ' ', 2) as "lastName", 
    u.email || '.alt' as email,  -- Make email unique for second therapist relationship
    '+1-555-' || LPAD((RANDOM() * 9999)::INT::TEXT, 4, '0') as phone,
    (SELECT id FROM "user" WHERE 'coach' = ANY(roles) AND id != 
        (SELECT "therapistId" FROM patients WHERE email = u.email LIMIT 1) 
     ORDER BY RANDOM() LIMIT 1) as "therapistId",
    '{"goals": ["Work-Life Balance", "Career Development"], "sessionLength": 60, "preferredTime": "evening"}'::jsonb as preferences,
    CASE WHEN RANDOM() > 0.3 THEN true ELSE false END as "whatsappOptIn"
FROM "user" u
WHERE 'client' = ANY(u.roles) 
  AND RANDOM() > 0.6  -- About 40% of clients will have multiple therapists
LIMIT 12;

-- Create appointments using the correct column names
INSERT INTO appointments (title, start_time, end_time, "patientId", description, status, datetime, created_by, therapist_id, client_id)
SELECT 
    'Coaching Session with ' || p."firstName" || ' ' || p."lastName" as title,
    NOW() + (RANDOM() * INTERVAL '30 days') as start_time,
    NOW() + (RANDOM() * INTERVAL '30 days') + INTERVAL '50 minutes' as end_time, 
    p.id as "patientId",
    'Personal development coaching session focusing on ' || 
    CASE WHEN RANDOM() > 0.5 THEN 'goal setting and achievement' 
         ELSE 'stress management and mindfulness' END as description,
    CASE WHEN RANDOM() > 0.8 THEN 'completed'::appointments_status_enum
         WHEN RANDOM() > 0.6 THEN 'confirmed'::appointments_status_enum
         ELSE 'scheduled'::appointments_status_enum END as status,
    NOW() + (RANDOM() * INTERVAL '30 days') as datetime,
    (SELECT id::uuid FROM "user" WHERE 'coach' = ANY(roles) ORDER BY RANDOM() LIMIT 1) as created_by,
    (SELECT id::uuid FROM "user" WHERE 'coach' = ANY(roles) ORDER BY RANDOM() LIMIT 1) as therapist_id,
    (SELECT id::uuid FROM "user" WHERE 'client' = ANY(roles) ORDER BY RANDOM() LIMIT 1) as client_id
FROM patients p
WHERE RANDOM() > 0.3  -- Create appointments for about 70% of patients
LIMIT 50;

-- Create session notes using correct column names
INSERT INTO session_notes ("patientId", "therapistId", type, note, date)
SELECT 
    p.id as "patientId",
    p."therapistId",
    CASE WHEN RANDOM() > 0.6 THEN 'progress_note'
         WHEN RANDOM() > 0.3 THEN 'session_summary'
         ELSE 'treatment_plan' END as type,
    'Session focused on ' || 
    CASE WHEN RANDOM() > 0.7 THEN 'exploring personal values and setting meaningful goals. Client showed great insight into their motivation patterns.'
         WHEN RANDOM() > 0.4 THEN 'developing coping strategies for workplace stress. Introduced mindfulness techniques and breathing exercises.'
         ELSE 'building confidence and self-esteem. Practiced positive self-talk and visualization exercises.' END as note,
    NOW() - (RANDOM() * INTERVAL '60 days') as date
FROM patients p
WHERE RANDOM() > 0.4  -- Create notes for about 60% of patients
LIMIT 40;

-- Display final summary
SELECT '=== RELATIONSHIPS CREATED SUCCESSFULLY ===' as status;
SELECT COUNT(*) as total_users FROM "user";
SELECT COUNT(*) as therapist_count FROM "user" WHERE 'coach' = ANY(roles);  
SELECT COUNT(*) as client_count FROM "user" WHERE 'client' = ANY(roles);
SELECT COUNT(*) as patient_records FROM patients;
SELECT COUNT(*) as appointment_count FROM appointments;
SELECT COUNT(*) as session_note_count FROM session_notes;

-- Show relationships
SELECT '=== PATIENT-THERAPIST RELATIONSHIPS ===' as info;
SELECT 
    p."firstName" || ' ' || p."lastName" as patient_name,
    u.name as therapist_name,
    LEFT(p.email, 25) || '...' as patient_email
FROM patients p 
JOIN "user" u ON u.id = p."therapistId"
LIMIT 15;