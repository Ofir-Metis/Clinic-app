-- Create comprehensive test data for clinic app with correct schema
-- 10 therapists and 30 clients with relationships

-- Insert therapist users 
INSERT INTO "user" (email, name, password, roles) VALUES
('dr.sarah.wilson@clinic.com', 'Dr. Sarah Wilson', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['coach']),
('dr.michael.brown@clinic.com', 'Dr. Michael Brown', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['coach']),
('dr.jennifer.davis@clinic.com', 'Dr. Jennifer Davis', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['coach']),
('dr.robert.johnson@clinic.com', 'Dr. Robert Johnson', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['coach']),
('dr.emily.anderson@clinic.com', 'Dr. Emily Anderson', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['coach']),
('dr.david.martinez@clinic.com', 'Dr. David Martinez', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['coach']),
('dr.lisa.thompson@clinic.com', 'Dr. Lisa Thompson', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['coach']),
('dr.james.white@clinic.com', 'Dr. James White', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['coach']),
('dr.amanda.garcia@clinic.com', 'Dr. Amanda Garcia', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['coach']),
('dr.christopher.lee@clinic.com', 'Dr. Christopher Lee', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['coach'])
ON CONFLICT (email) DO NOTHING;

-- Insert client users
INSERT INTO "user" (email, name, password, roles) VALUES
('alice.johnson@email.com', 'Alice Johnson', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('bob.smith@email.com', 'Bob Smith', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('carol.williams@email.com', 'Carol Williams', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('david.brown@email.com', 'David Brown', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('emma.davis@email.com', 'Emma Davis', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('frank.wilson@email.com', 'Frank Wilson', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('grace.miller@email.com', 'Grace Miller', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('henry.moore@email.com', 'Henry Moore', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('isabella.taylor@email.com', 'Isabella Taylor', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('jack.anderson@email.com', 'Jack Anderson', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('kate.thomas@email.com', 'Kate Thomas', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('liam.jackson@email.com', 'Liam Jackson', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('mia.white@email.com', 'Mia White', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('noah.harris@email.com', 'Noah Harris', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('olivia.martin@email.com', 'Olivia Martin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('peter.garcia@email.com', 'Peter Garcia', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('quinn.rodriguez@email.com', 'Quinn Rodriguez', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('ruby.lopez@email.com', 'Ruby Lopez', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('samuel.lee@email.com', 'Samuel Lee', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('tina.gonzalez@email.com', 'Tina Gonzalez', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('ursula.wilson@email.com', 'Ursula Wilson', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('victor.hernandez@email.com', 'Victor Hernandez', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('wendy.moore@email.com', 'Wendy Moore', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('xavier.clark@email.com', 'Xavier Clark', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('yara.lewis@email.com', 'Yara Lewis', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('zachary.walker@email.com', 'Zachary Walker', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('anna.hall@email.com', 'Anna Hall', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('brian.allen@email.com', 'Brian Allen', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('chloe.young@email.com', 'Chloe Young', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client']),
('daniel.king@email.com', 'Daniel King', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ARRAY['client'])
ON CONFLICT (email) DO NOTHING;

-- Get therapist IDs for creating patient relationships
WITH therapist_ids AS (
  SELECT id, email, ROW_NUMBER() OVER (ORDER BY id) as rn 
  FROM "user" WHERE 'coach' = ANY(roles)
)
-- Create patient records with therapist assignments (some clients have multiple therapists)
INSERT INTO patients ("firstName", "lastName", email, phone, "therapistId", preferences, "whatsappOptIn")
SELECT 
    SPLIT_PART(u.name, ' ', 1) as "firstName",
    SPLIT_PART(u.name, ' ', 2) as "lastName", 
    u.email,
    '+1-555-' || LPAD((RANDOM() * 9999)::INT::TEXT, 4, '0') as phone,
    t.id as "therapistId",
    '{"goals": ["Personal Growth", "Stress Management"], "sessionLength": 50, "preferredTime": "afternoon"}'::jsonb as preferences,
    CASE WHEN RANDOM() > 0.5 THEN true ELSE false END as "whatsappOptIn"
FROM "user" u
CROSS JOIN therapist_ids t
WHERE 'client' = ANY(u.roles)
  AND (
    -- Assign each client to 1-3 therapists randomly
    (EXTRACT(epoch FROM u."createdAt")::bigint % 10) / 10.0 > 0.7 -- 30% get assigned to this therapist
    OR (EXTRACT(epoch FROM u."createdAt")::bigint + t.rn) % 7 = 0 -- Some get multiple therapists
  )
ON CONFLICT (email, "therapistId") DO NOTHING;

-- Create some appointments for the patients
INSERT INTO appointments (title, "startTime", "endTime", "patientId", description, type, location, status)
SELECT 
    'Coaching Session with ' || p."firstName" || ' ' || p."lastName" as title,
    NOW() + (RANDOM() * INTERVAL '30 days') as "startTime",
    NOW() + (RANDOM() * INTERVAL '30 days') + INTERVAL '50 minutes' as "endTime", 
    p.id as "patientId",
    'Personal development coaching session focusing on ' || 
    CASE WHEN RANDOM() > 0.5 THEN 'goal setting and achievement' 
         ELSE 'stress management and mindfulness' END as description,
    CASE WHEN RANDOM() > 0.7 THEN 'follow-up' 
         WHEN RANDOM() > 0.4 THEN 'initial-consultation'
         ELSE 'regular-session' END as type,
    CASE WHEN RANDOM() > 0.8 THEN 'Online Video Call'
         ELSE 'Office - Room ' || (1 + (RANDOM() * 5)::INT) END as location,
    CASE WHEN RANDOM() > 0.8 THEN 'completed'
         WHEN RANDOM() > 0.6 THEN 'confirmed'
         WHEN RANDOM() > 0.3 THEN 'scheduled'
         ELSE 'pending' END as status
FROM patients p
WHERE RANDOM() > 0.3  -- Create appointments for about 70% of patients
LIMIT 50;

-- Create some session notes
INSERT INTO session_notes ("patientId", content, "sessionDate", tags, "createdAt")
SELECT 
    p.id as "patientId",
    'Session focused on ' || 
    CASE WHEN RANDOM() > 0.7 THEN 'exploring personal values and setting meaningful goals. Client showed great insight into their motivation patterns.'
         WHEN RANDOM() > 0.4 THEN 'developing coping strategies for workplace stress. Introduced mindfulness techniques and breathing exercises.'
         ELSE 'building confidence and self-esteem. Practiced positive self-talk and visualization exercises.' END as content,
    NOW() - (RANDOM() * INTERVAL '60 days') as "sessionDate",
    ARRAY[
        CASE WHEN RANDOM() > 0.5 THEN 'breakthrough' ELSE 'progress' END,
        CASE WHEN RANDOM() > 0.6 THEN 'mindfulness' WHEN RANDOM() > 0.3 THEN 'goals' ELSE 'confidence' END
    ] as tags,
    NOW() - (RANDOM() * INTERVAL '60 days') as "createdAt"
FROM patients p
WHERE RANDOM() > 0.4  -- Create notes for about 60% of patients
LIMIT 40;

-- Display summary
SELECT '=== TEST DATA CREATION COMPLETED ===' as status;
SELECT COUNT(*) as total_users FROM "user";
SELECT COUNT(*) as therapist_count FROM "user" WHERE 'coach' = ANY(roles);
SELECT COUNT(*) as client_count FROM "user" WHERE 'client' = ANY(roles);
SELECT COUNT(*) as patient_records FROM patients;
SELECT COUNT(*) as appointment_count FROM appointments;
SELECT COUNT(*) as session_note_count FROM session_notes;

-- Show some sample data
SELECT '=== SAMPLE THERAPISTS ===' as info;
SELECT name, email FROM "user" WHERE 'coach' = ANY(roles) LIMIT 5;

SELECT '=== SAMPLE CLIENTS ===' as info; 
SELECT name, email FROM "user" WHERE 'client' = ANY(roles) LIMIT 5;

SELECT '=== SAMPLE PATIENT-THERAPIST RELATIONSHIPS ===' as info;
SELECT 
    p."firstName" || ' ' || p."lastName" as patient_name,
    u.name as therapist_name,
    p.email as patient_email
FROM patients p 
JOIN "user" u ON u.id = p."therapistId"
LIMIT 10;