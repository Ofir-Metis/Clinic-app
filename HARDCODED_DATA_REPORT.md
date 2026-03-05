# Hardcoded Data Report

**Generated:** December 27, 2025
**Status:** Requires fixes to replace hardcoded data with real API data

---

## Summary

| Category | Files Affected | Severity |
|----------|---------------|----------|
| Mock User Names | 15 files | **HIGH** |
| Mock Email Addresses | 6 files | **HIGH** |
| Mock Phone Numbers | 1 file | MEDIUM |
| Mock Coach/Client Data | 12 files | **HIGH** |
| Mock Appointments | 5 files | **HIGH** |
| Mock Statistics | 3 files | **HIGH** |
| Mock Prices/Ratings | 4 files | MEDIUM |
| Test Files (Acceptable) | 8 files | LOW |

---

## CRITICAL - Must Fix (Production-Visible)

### 1. CalendarPage.tsx (Lines 71-89)
**File:** `frontend/src/pages/CalendarPage.tsx`
```typescript
// Line 71-78: Hardcoded patient list
const mockPatients: Patient[] = [
  { id: '1', name: 'Sarah Johnson' },
  // ...
];

// Line 78-89: Hardcoded appointments
const mockAppointments: Appointment[] = [
  {
    patientName: 'Sarah Johnson',
    meetingUrl: 'https://meet.example.com/session1',
    // ...
  }
];

// Line 108: Uses mock data
const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
```
**Fix:** Fetch real appointments and patients from API

---

### 2. TherapistHomePage.tsx (Lines 67-127)
**File:** `frontend/src/pages/TherapistHomePage.tsx`
```typescript
// Line 67-93: Hardcoded appointments
const mockAppointments: Appointment[] = [/* ... */];

// Line 94-123: Hardcoded notifications
const mockNotifications: Notification[] = [/* ... */];

// Line 125-127: Using mock data
const [appointments] = useState<Appointment[]>(mockAppointments);
const [notifications] = useState<Notification[]>(mockNotifications);
const [therapistName] = useState('ד"ר כהן'); // Hardcoded Hebrew name
```
**Fix:** Fetch real data from API, get therapist name from auth context

---

### 3. TherapistBillingPage.tsx (Lines 132-144)
**File:** `frontend/src/pages/TherapistBillingPage.tsx`
```typescript
// Line 142-144: Hardcoded client list with fake emails/phones
{ id: '1', name: 'Anna Goldberg', email: 'anna@example.com', phone: '050-123-4567' },
{ id: '2', name: 'Michael Rosen', email: 'michael@example.com', phone: '052-987-6543' },
{ id: '3', name: 'Rachel Levy', email: 'rachel@example.com', phone: '053-456-7890' },
```
**Fix:** Fetch clients from patients API

---

### 4. ClientDashboard.tsx (Lines 135-257)
**File:** `frontend/src/pages/client/ClientDashboard.tsx`
```typescript
// Line 136-165: Mock coaches
const mockCoaches = [
  { name: 'Dr. Emily Chen', specialization: 'Life & Wellness Coaching' },
  { name: 'Dr. Aisha Patel', specialization: 'Mindfulness & Stress Management' },
];

// Line 163: Hardcoded client name
{ name: "Sarah Johnson", profileImage: "/api/placeholder/avatar" }

// Line 178-257: Mock appointments with hardcoded coach names
coachName: 'Dr. Emily Chen',
coachName: 'Dr. Aisha Patel',
```
**Fix:** Fetch client data from auth context, coaches from API

---

### 5. ClientAppointments.tsx (Lines 97-193)
**File:** `frontend/src/pages/client/ClientAppointments.tsx`
```typescript
// Line 98-124: Mock coaches
const mockCoaches = [
  { name: 'Dr. Emily Chen', specialization: 'Life & Wellness Coaching' },
  { name: 'Dr. Aisha Patel', specialization: 'Career & Leadership' },
];

// Line 125-191: Mock appointments
const mockAppointments: Appointment[] = [/* uses mockCoaches */];
```
**Fix:** Fetch appointments from API

---

### 6. ClientBookingSystem.tsx (Lines 160-221)
**File:** `frontend/src/pages/client/ClientBookingSystem.tsx`
```typescript
// Line 161-203: Mock coaches with hardcoded prices
const mockCoaches: Coach[] = [
  {
    name: 'Dr. Sarah Johnson',
    rating: 4.9,
    sessionTypes: [
      { price: 120 },
      { price: 100 }
    ]
  }
];

// Line 204-218: Mock appointments
const mockAppointments: Appointment[] = [
  { coachName: 'Dr. Sarah Johnson', price: 100 }
];
```
**Fix:** Fetch coaches and pricing from API

---

### 7. ClientGoals.tsx (Lines 264-453)
**File:** `frontend/src/pages/client/ClientGoals.tsx`
```typescript
// Line 265-435: Mock goals data
const mockGoals: Goal[] = [/* ... */];

// Line 447-451: Hardcoded coaches list
const mockCoaches: Coach[] = [
  { id: 'coach1', name: 'Dr. Emily Chen', specialization: 'Life & Wellness Coaching' },
  { id: 'coach2', name: 'Marcus Rodriguez', specialization: 'Career & Leadership' },
  { id: 'coach3', name: 'Dr. Aisha Patel', specialization: 'Mindfulness & Stress Management' }
];
```
**Fix:** Fetch goals and coaches from API

---

### 8. ClientProgressSharing.tsx (Lines 191-305)
**File:** `frontend/src/pages/client/ClientProgressSharing.tsx`
```typescript
// Line 192-206: Mock coaches
const mockCoaches: Coach[] = [
  { name: 'Dr. Sarah Johnson', specialization: 'Life & Career Coaching' }
];

// Line 207-272: Mock progress updates
const mockProgressUpdates: ProgressUpdate[] = [
  { coachName: 'Dr. Sarah Johnson' }
];

// Line 273-301: Mock celebrations
const mockCelebrations: CelebrationMoment[] = [/* ... */];
```
**Fix:** Fetch progress data from API

---

### 9. ClientInvitations.tsx (Lines 220-353)
**File:** `frontend/src/pages/client/ClientInvitations.tsx`
```typescript
// Line 221-352: Mock invitations
const mockInvitations: CoachInvitation[] = [
  { coachName: 'Dr. Sarah Johnson' },
  { coachName: 'Dr. Aisha Patel' }
];
```
**Fix:** Fetch invitations from API

---

### 10. ClientLoginPage.tsx (Lines 75-84)
**File:** `frontend/src/pages/client/ClientLoginPage.tsx`
```typescript
// Line 78-84: Mock login response
localStorage.setItem('clientToken', 'mock-client-token');
localStorage.setItem('clientData', JSON.stringify({
  name: 'Sarah Johnson',
  email: credentials.email,
  coachName: 'Dr. Emily Chen'
}));
```
**Fix:** Use real authentication API response

---

### 11. CoachDiscovery.tsx (Lines 193-302)
**File:** `frontend/src/pages/client/CoachDiscovery.tsx`
```typescript
// Line 194-301: Mock coaches
const mockCoaches: Coach[] = [
  {
    firstName: 'Dr. Sarah',
    lastName: 'Johnson',
    specializations: ['Life Coaching', 'Mindfulness'],
  },
  {
    firstName: 'Dr. Aisha',
    lastName: 'Patel',
    specializations: ['Health & Wellness'],
  }
];
```
**Fix:** Fetch coaches from coaches API

---

### 12. InvitationManagementPage.tsx (Lines 247-374)
**File:** `frontend/src/pages/InvitationManagementPage.tsx`
```typescript
// Line 248-373: Mock invitations
const mockInvitations: CoachInvitation[] = [
  { coachName: 'Dr. Sarah Johnson' },
  // Multiple hardcoded invitations
];
```
**Fix:** Fetch invitations from API

---

### 13. SubscriptionManagementPage.tsx (Lines 109-170)
**File:** `frontend/src/pages/admin/SubscriptionManagementPage.tsx`
```typescript
// Line 126-145: Hardcoded subscription plans with prices
priceMonthlyNis: 180,
priceMonthlyUsd: 50,

// Line 156-170: Mock subscriptions
coachName: 'Dr. Sarah Cohen',
coachEmail: 'sarah@example.com',
coachEmail: 'david@example.com',
```
**Fix:** Fetch subscription plans and user data from API

---

### 14. AppointmentRecordingManager.tsx (Lines 197-287)
**File:** `frontend/src/components/AppointmentRecordingManager.tsx`
```typescript
// Line 197: Comment says mock
// Mock upload with progress simulation

// Line 250-286: Mock AI summary
const mockSummary: SessionSummary = {
  // Hardcoded summary data
};
```
**Fix:** Use real upload and AI summary APIs

---

### 15. CoachGoalPlanningPage.tsx (Lines 334-551)
**File:** `frontend/src/pages/CoachGoalPlanningPage.tsx`
```typescript
// Line 335-431: Mock templates
const mockTemplates: GoalTemplate[] = [/* ... */];

// Line 437-502: Mock programs
const mockPrograms: CoachingProgram[] = [/* ... */];

// Line 508-550: Mock methodologies
const mockMethodologies: GoalMethodology[] = [/* ... */];
```
**Fix:** Fetch templates, programs, and methodologies from API

---

### 16. ClientAchievements.tsx (Lines 210-396)
**File:** `frontend/src/pages/client/ClientAchievements.tsx`
```typescript
// Line 211-308: Mock achievements
const mockAchievements: Achievement[] = [/* ... */];

// Line 309-344: Mock streaks
const mockStreaks: StreakData[] = [/* ... */];

// Line 345-365: Mock milestones
const mockMilestones: Milestone[] = [/* ... */];

// Line 366-381: Mock level
const mockLevel: Level = {/* ... */};

// Line 382-391: Mock stats
const mockStats = {/* ... */};
```
**Fix:** Fetch achievements from progress API

---

### 17. RecordingDemoPage.tsx (Lines 36-222)
**File:** `frontend/src/pages/RecordingDemoPage.tsx`
```typescript
// Line 37-46: Mock appointment
const mockAppointment = {/* ... */};

// Line 48-57: Mock recordings
const mockRecordings = [/* ... */];
```
**Note:** This is a demo page - may be acceptable to keep for demonstration purposes

---

## MEDIUM Priority

### 18. ClientRegisterPage.tsx (Line 196)
**File:** `frontend/src/pages/client/ClientRegisterPage.tsx`
```typescript
// Line 196: Mock token on registration
localStorage.setItem('clientToken', 'mock-client-token');
```
**Fix:** Use real registration API response token

---

### 19. AuthPage.tsx (Lines 103, 146)
**File:** `frontend/src/pages/AuthPage.tsx`
```typescript
// Line 103: Mock token on login
localStorage.setItem('token', 'mock-jwt-token-' + Date.now());

// Line 146: Mock token on register
localStorage.setItem('token', 'mock-jwt-token-' + Date.now());
```
**Fix:** Use real auth API response token

---

### 20. ProgressDashboard.tsx (Lines 110-137)
**File:** `frontend/src/components/progress/ProgressDashboard.tsx`
```typescript
// Line 110: Comment says mock
// Mock API call - replace with actual API

// Line 137: Comment says mock
// Mock data for development
```
**Fix:** Implement real API call

---

### 21. AppointmentPage.tsx (Lines 67-94)
**File:** `frontend/src/pages/AppointmentPage.tsx`
```typescript
// Line 67: Mock meeting configuration
// Mock meeting configuration based on appointment data

// Line 94: Mock API call
// Mock API call to change meeting type
```
**Fix:** Use real appointment API

---

## LOW Priority (Test Files - Acceptable)

These files contain mock data for testing purposes and are acceptable:

1. `frontend/src/hooks/useGoogleIntegration.test.ts`
2. `frontend/src/api/auth.spec.ts`
3. `frontend/src/services/RecordingService.spec.ts`
4. `frontend/src/components/SessionRecorder.spec.tsx`
5. `frontend/src/components/ScheduleAppointmentModal.spec.tsx`
6. `frontend/src/pages/DashboardPage.spec.tsx`
7. `frontend/src/pages/PatientDetailPage.spec.tsx`
8. `frontend/src/pages/TreatmentHistoryPage.spec.tsx`
9. `frontend/src/pages/TherapistProfilePage.spec.tsx`
10. `frontend/src/pages/NotificationsPage.spec.tsx`
11. `frontend/src/pages/PatientListPage.spec.tsx`
12. `frontend/src/pages/SettingsPage.spec.tsx`

---

## Previously Fixed

✅ **DashboardPage.tsx** - Fixed to show real user stats instead of hardcoded minimums
✅ **SettingsPage.tsx** - Fixed to show authenticated user data instead of "Dr. Sarah Johnson"

---

## Recommended Fix Priority

### Phase 1 - Critical (User-Facing)
1. ClientLoginPage.tsx - Uses mock tokens
2. ClientRegisterPage.tsx - Uses mock tokens
3. AuthPage.tsx - Uses mock tokens
4. ClientDashboard.tsx - Shows fake coach names
5. CalendarPage.tsx - Shows fake appointments

### Phase 2 - High (Core Functionality)
6. ClientAppointments.tsx
7. ClientBookingSystem.tsx
8. ClientGoals.tsx
9. TherapistHomePage.tsx
10. TherapistBillingPage.tsx

### Phase 3 - Medium (Secondary Features)
11. CoachDiscovery.tsx
12. ClientProgressSharing.tsx
13. ClientInvitations.tsx
14. InvitationManagementPage.tsx
15. ClientAchievements.tsx

### Phase 4 - Low (Admin/Config)
16. SubscriptionManagementPage.tsx
17. CoachGoalPlanningPage.tsx
18. AppointmentRecordingManager.tsx
19. ProgressDashboard.tsx

---

## API Endpoints Needed

To fix the hardcoded data, these API endpoints should be implemented or verified:

| Endpoint | Purpose | Status |
|----------|---------|--------|
| GET /coaches | List coaches | Verify |
| GET /appointments | User appointments | ✅ Exists |
| GET /patients | Client list | ✅ Exists |
| GET /goals | User goals | Verify |
| GET /progress | Progress data | Verify |
| GET /achievements | User achievements | Verify |
| GET /invitations | Coach invitations | Verify |
| GET /subscriptions | Subscription plans | Verify |
| POST /auth/login | Real authentication | ✅ Exists |
| POST /auth/register | Real registration | Verify |

---

## Next Steps

1. Verify which API endpoints exist and work correctly
2. Start fixing Phase 1 files (authentication-related)
3. Progress through each phase
4. Test each fix with E2E tests
