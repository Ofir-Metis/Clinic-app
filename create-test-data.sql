-- Create comprehensive test data for clinic app
-- 10 therapists and 30 clients with relationships

-- Insert therapists
INSERT INTO users (email, password, role, "createdAt", "updatedAt") VALUES
('dr.sarah.wilson@clinic.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'coach', NOW(), NOW()),
('dr.michael.brown@clinic.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'coach', NOW(), NOW()),
('dr.jennifer.davis@clinic.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'coach', NOW(), NOW()),
('dr.robert.johnson@clinic.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'coach', NOW(), NOW()),
('dr.emily.anderson@clinic.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'coach', NOW(), NOW()),
('dr.david.martinez@clinic.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'coach', NOW(), NOW()),
('dr.lisa.thompson@clinic.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'coach', NOW(), NOW()),
('dr.james.white@clinic.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'coach', NOW(), NOW()),
('dr.amanda.garcia@clinic.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'coach', NOW(), NOW()),
('dr.christopher.lee@clinic.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'coach', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert clients (30 clients)
INSERT INTO users (email, password, role, "createdAt", "updatedAt") VALUES
('alice.johnson@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('bob.smith@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('carol.williams@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('david.brown@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('emma.davis@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('frank.wilson@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('grace.miller@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('henry.moore@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('isabella.taylor@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('jack.anderson@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('kate.thomas@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('liam.jackson@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('mia.white@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('noah.harris@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('olivia.martin@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('peter.garcia@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('quinn.rodriguez@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('ruby.lopez@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('samuel.lee@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('tina.gonzalez@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('ursula.wilson@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('victor.hernandez@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('wendy.moore@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('xavier.clark@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('yara.lewis@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('zachary.walker@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('anna.hall@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('brian.allen@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('chloe.young@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW()),
('daniel.king@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Create patient records for clients (linking to users)
INSERT INTO patients (email, "firstName", "lastName", "phoneNumber", "dateOfBirth", "createdAt", "updatedAt")
SELECT 
    u.email,
    CASE 
        WHEN u.email LIKE 'alice%' THEN 'Alice'
        WHEN u.email LIKE 'bob%' THEN 'Bob'
        WHEN u.email LIKE 'carol%' THEN 'Carol'
        WHEN u.email LIKE 'david%' THEN 'David'
        WHEN u.email LIKE 'emma%' THEN 'Emma'
        WHEN u.email LIKE 'frank%' THEN 'Frank'
        WHEN u.email LIKE 'grace%' THEN 'Grace'
        WHEN u.email LIKE 'henry%' THEN 'Henry'
        WHEN u.email LIKE 'isabella%' THEN 'Isabella'
        WHEN u.email LIKE 'jack%' THEN 'Jack'
        WHEN u.email LIKE 'kate%' THEN 'Kate'
        WHEN u.email LIKE 'liam%' THEN 'Liam'
        WHEN u.email LIKE 'mia%' THEN 'Mia'
        WHEN u.email LIKE 'noah%' THEN 'Noah'
        WHEN u.email LIKE 'olivia%' THEN 'Olivia'
        WHEN u.email LIKE 'peter%' THEN 'Peter'
        WHEN u.email LIKE 'quinn%' THEN 'Quinn'
        WHEN u.email LIKE 'ruby%' THEN 'Ruby'
        WHEN u.email LIKE 'samuel%' THEN 'Samuel'
        WHEN u.email LIKE 'tina%' THEN 'Tina'
        WHEN u.email LIKE 'ursula%' THEN 'Ursula'
        WHEN u.email LIKE 'victor%' THEN 'Victor'
        WHEN u.email LIKE 'wendy%' THEN 'Wendy'
        WHEN u.email LIKE 'xavier%' THEN 'Xavier'
        WHEN u.email LIKE 'yara%' THEN 'Yara'
        WHEN u.email LIKE 'zachary%' THEN 'Zachary'
        WHEN u.email LIKE 'anna%' THEN 'Anna'
        WHEN u.email LIKE 'brian%' THEN 'Brian'
        WHEN u.email LIKE 'chloe%' THEN 'Chloe'
        WHEN u.email LIKE 'daniel%' THEN 'Daniel'
    END as "firstName",
    CASE 
        WHEN u.email LIKE '%johnson%' THEN 'Johnson'
        WHEN u.email LIKE '%smith%' THEN 'Smith'
        WHEN u.email LIKE '%williams%' THEN 'Williams'
        WHEN u.email LIKE '%brown%' THEN 'Brown'
        WHEN u.email LIKE '%davis%' THEN 'Davis'
        WHEN u.email LIKE '%wilson%' THEN 'Wilson'
        WHEN u.email LIKE '%miller%' THEN 'Miller'
        WHEN u.email LIKE '%moore%' THEN 'Moore'
        WHEN u.email LIKE '%taylor%' THEN 'Taylor'
        WHEN u.email LIKE '%anderson%' THEN 'Anderson'
        WHEN u.email LIKE '%thomas%' THEN 'Thomas'
        WHEN u.email LIKE '%jackson%' THEN 'Jackson'
        WHEN u.email LIKE '%white%' THEN 'White'
        WHEN u.email LIKE '%harris%' THEN 'Harris'
        WHEN u.email LIKE '%martin%' THEN 'Martin'
        WHEN u.email LIKE '%garcia%' THEN 'Garcia'
        WHEN u.email LIKE '%rodriguez%' THEN 'Rodriguez'
        WHEN u.email LIKE '%lopez%' THEN 'Lopez'
        WHEN u.email LIKE '%lee%' THEN 'Lee'
        WHEN u.email LIKE '%gonzalez%' THEN 'Gonzalez'
        WHEN u.email LIKE '%hernandez%' THEN 'Hernandez'
        WHEN u.email LIKE '%clark%' THEN 'Clark'
        WHEN u.email LIKE '%lewis%' THEN 'Lewis'
        WHEN u.email LIKE '%walker%' THEN 'Walker'
        WHEN u.email LIKE '%hall%' THEN 'Hall'
        WHEN u.email LIKE '%allen%' THEN 'Allen'
        WHEN u.email LIKE '%young%' THEN 'Young'
        WHEN u.email LIKE '%king%' THEN 'King'
    END as "lastName",
    '+1-555-' || LPAD((RANDOM() * 9999)::INT::TEXT, 4, '0') as "phoneNumber",
    DATE '1980-01-01' + (RANDOM() * (DATE '2000-01-01' - DATE '1980-01-01'))::INT as "dateOfBirth",
    NOW(),
    NOW()
FROM users u 
WHERE u.role = 'client'
ON CONFLICT (email) DO NOTHING;

-- Display summary
SELECT 'Data insertion completed' as status;
SELECT COUNT(*) as therapist_count FROM users WHERE role = 'coach';
SELECT COUNT(*) as client_count FROM users WHERE role = 'client';
SELECT COUNT(*) as patient_count FROM patients;