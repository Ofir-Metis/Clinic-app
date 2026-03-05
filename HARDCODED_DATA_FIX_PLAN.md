# Hardcoded Data Fix Plan

**Generated:** December 27, 2025
**Based on:** API Research and Codebase Analysis

---

## Executive Summary

This document provides a detailed plan to replace all hardcoded/mock data with real API data sources. Each fix includes:
- Current hardcoded data
- Required API endpoint
- Data transformation needed
- Implementation steps

---

## Phase 1: Authentication (CRITICAL)

### 1.1 ClientLoginPage.tsx
**File:** `frontend/src/pages/client/ClientLoginPage.tsx`
**Lines:** 75-97

**Current Hardcoded Data:**
```typescript
localStorage.setItem('clientToken', 'mock-client-token');
localStorage.setItem('clientData', JSON.stringify({
  name: 'Sarah Johnson',
  email: credentials.email,
  coachName: 'Dr. Emily Chen'
}));
```

**Real API Endpoint:** `POST /auth/login`

**API Response Format:**
```typescript
{
  access_token: string;
  user: {
    id: number;
    email: string;
    name: string;
    roles: string[];  // ['client'] for clients
  }
}
```

**Implementation Steps:**
1. Import `login` from `@/api/auth` and `useAuth` from `@/contexts/AuthContext`
2. Replace mock login with real API call:
```typescript
import { login as authLogin } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';

const { login } = useAuth();

const handleSubmit = async () => {
  try {
    const response = await authLogin(credentials.email, credentials.password);

    const userData = {
      id: response.user.id.toString(),
      email: response.user.email,
      name: response.user.name || '',
      role: 'client' as const,
    };

    login({
      accessToken: response.access_token,
      refreshToken: response.access_token, // Use same token if no refresh
      expiresIn: 3600
    }, userData);

    navigate('/client/dashboard');
  } catch (error) {
    setError('Invalid credentials');
  }
};
```

3. Remove all `localStorage.setItem` calls for mock data
4. Coach name should be fetched separately after login via client-relationships API

---

### 1.2 ClientRegisterPage.tsx
**File:** `frontend/src/pages/client/ClientRegisterPage.tsx`
**Line:** 196

**Current Hardcoded Data:**
```typescript
localStorage.setItem('clientToken', 'mock-client-token');
```

**Real API Endpoint:** `POST /auth/register`

**API Response Format:**
```typescript
{
  id: number;
  email: string;
  name: string;
  roles: string[];
}
```

**Implementation Steps:**
1. Create registration API function in `api/auth.ts`:
```typescript
export const register = async (data: {
  email: string;
  password: string;
  name: string;
  role: string;
}) => {
  const { data: response } = await api.post('/auth/register', data);
  return response;
};
```

2. After registration, call login API to get tokens
3. Use AuthContext to store credentials properly

---

### 1.3 AuthPage.tsx
**File:** `frontend/src/pages/AuthPage.tsx`
**Lines:** 103, 146

**Current Hardcoded Data:**
```typescript
localStorage.setItem('token', 'mock-jwt-token-' + Date.now());
```

**Real API Endpoint:** `POST /auth/login` and `POST /auth/register`

**Implementation Steps:**
1. Same pattern as ClientLoginPage - use real auth API
2. Use AuthContext for token management
3. Remove mock token generation

---

## Phase 2: Client Portal

### 2.1 ClientDashboard.tsx
**File:** `frontend/src/pages/client/ClientDashboard.tsx`
**Lines:** 135-257

**Current Hardcoded Data:**
```typescript
const mockCoaches = [
  { name: 'Dr. Emily Chen', specialization: 'Life & Wellness Coaching' },
  { name: 'Dr. Aisha Patel', specialization: 'Mindfulness & Stress Management' },
];
{ name: "Sarah Johnson", profileImage: "/api/placeholder/avatar" }
```

**Real API Endpoints:**
- Client info: From AuthContext `user` object
- Coaches: `GET /clients/{clientId}/coaches` or from client-relationships-service
- Appointments: `GET /client/appointments?patientId={clientId}`

**Data Sources:**
```typescript
// Client info from AuthContext
const { user } = useAuth();

// Coaches from relationship API
interface Coach {
  id: string;
  firstName: string;
  lastName: string;
  professionalTitle: string;
  specializations: string[];
  profileImageUrl?: string;
}

// API: GET /api/clients/{clientId}/coaches
const fetchMyCoaches = async (clientId: string): Promise<Coach[]> => {
  const { data } = await api.get(`/clients/${clientId}/coaches`);
  return data.data || [];
};
```

**Implementation Steps:**
1. Get client name/email from `useAuth()` hook
2. Create API function to fetch client's coaches
3. Fetch upcoming appointments from existing appointments API
4. Remove all mock data arrays

---

### 2.2 ClientAppointments.tsx
**File:** `frontend/src/pages/client/ClientAppointments.tsx`
**Lines:** 97-193

**Current Hardcoded Data:**
```typescript
const mockCoaches = [
  { name: 'Dr. Emily Chen', specialization: 'Life & Wellness Coaching' },
];
const mockAppointments: Appointment[] = [/* ... */];
```

**Real API Endpoint:** `GET /client/appointments`

**API Response Format:**
```typescript
{
  items: [{
    id: number;
    patientId: number;
    therapistId: number;
    startTime: Date;
    endTime: Date;
    title: string;
    description: string;
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
    meetingType: 'in-person' | 'online' | 'hybrid';
    // Coach info should be joined
    coach?: {
      name: string;
      specialization: string;
    }
  }];
  total: number;
}
```

**Implementation Steps:**
1. Use existing `getPatientAppointments` from `api/patientAppointments.ts`
2. Get client ID from AuthContext
3. Fetch appointments with coach info populated
4. Transform API response to match component interface

---

### 2.3 ClientBookingSystem.tsx
**File:** `frontend/src/pages/client/ClientBookingSystem.tsx`
**Lines:** 160-221

**Current Hardcoded Data:**
```typescript
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
```

**Real API Endpoints:**
- Coaches: `GET /search/coaches` or `GET /coaches`
- Availability: `GET /coaches/{id}/availability`

**Coach Entity Fields Available:**
```typescript
{
  id: string;
  firstName: string;
  lastName: string;
  professionalTitle: string;
  bio: string;
  specializations: string[];
  yearsOfExperience: number;
  averageRating: number;
  totalReviews: number;
  acceptingNewClients: boolean;
  pricingStructure: {
    currency: string;
    sessionRates: {
      individual: number;
      package: number;
    };
    packageOptions: [{
      name: string;
      sessions: number;
      price: number;
      description: string;
    }];
  };
  availability: {
    timezone: string;
    sessionDurations: number[];
    sessionTypes: { online: boolean; inPerson: boolean; };
  };
}
```

**Implementation Steps:**
1. Create coach booking API in `api/coaches.ts`:
```typescript
export const getAvailableCoaches = async (filters?: {
  specializations?: string[];
  priceRange?: [number, number];
  sessionType?: 'online' | 'inPerson';
}): Promise<Coach[]> => {
  const { data } = await api.get('/coaches', { params: filters });
  return data.profiles || data.data || [];
};

export const getCoachAvailability = async (coachId: string, date: string) => {
  const { data } = await api.get(`/coaches/${coachId}/availability`, {
    params: { date }
  });
  return data;
};
```

2. Fetch coaches on component mount
3. Populate pricing from coach's `pricingStructure`
4. Use real availability for booking slots

---

### 2.4 ClientGoals.tsx
**File:** `frontend/src/pages/client/ClientGoals.tsx`
**Lines:** 264-453

**Current Hardcoded Data:**
```typescript
const mockGoals: Goal[] = [/* ... */];
const mockCoaches: Coach[] = [
  { id: 'coach1', name: 'Dr. Emily Chen', specialization: 'Life & Wellness Coaching' },
];
```

**Real API Endpoints:**
- Goals: `GET /goals?clientId={id}` (progress-service)
- Coaches: From client-relationships-service

**Goal Entity (from progress-service):**
```typescript
{
  id: string;
  clientId: string;
  coachId?: string;
  title: string;
  description: string;
  category: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  priority: 'low' | 'medium' | 'high';
  targetDate?: Date;
  progress: number; // 0-100
  milestones: [{
    id: string;
    title: string;
    completed: boolean;
    completedAt?: Date;
  }];
  createdAt: Date;
  updatedAt: Date;
}
```

**Implementation Steps:**
1. Create goals API in `api/goals.ts`:
```typescript
export const getClientGoals = async (clientId: string) => {
  const { data } = await api.get('/goals', { params: { clientId } });
  return data.data || [];
};

export const createGoal = async (goal: CreateGoalDto) => {
  const { data } = await api.post('/goals', goal);
  return data;
};
```

2. Fetch goals on mount with client ID from AuthContext
3. Fetch coaches from client's relationships

---

### 2.5 CoachDiscovery.tsx
**File:** `frontend/src/pages/client/CoachDiscovery.tsx`
**Lines:** 193-302

**Current Hardcoded Data:**
```typescript
const mockCoaches: Coach[] = [
  {
    firstName: 'Dr. Sarah',
    lastName: 'Johnson',
    specializations: ['Life Coaching', 'Mindfulness'],
  },
];
```

**Real API Endpoints:**
- Search: `GET /search/coaches`
- Simple list: `GET /coaches`

**Implementation Steps:**
1. Create search API in `api/coaches.ts`:
```typescript
export const searchCoaches = async (params: {
  query?: string;
  specializations?: string[];
  location?: string;
  priceRange?: [number, number];
  rating?: number;
  acceptingNewClients?: boolean;
  from?: number;
  size?: number;
}) => {
  const { data } = await api.get('/search/coaches', { params });
  return {
    coaches: data.hits?.map(h => h._source) || [],
    total: data.total || 0
  };
};
```

2. Connect search/filter UI to API
3. Implement pagination with `from` and `size` params

---

### 2.6 ClientProgressSharing.tsx
**File:** `frontend/src/pages/client/ClientProgressSharing.tsx`
**Lines:** 191-305

**Current Hardcoded Data:**
```typescript
const mockCoaches: Coach[] = [
  { name: 'Dr. Sarah Johnson', specialization: 'Life & Career Coaching' }
];
const mockProgressUpdates: ProgressUpdate[] = [/* ... */];
const mockCelebrations: CelebrationMoment[] = [/* ... */];
```

**Real API Endpoints:**
- Progress: `GET /progress?clientId={id}` (progress-service)
- Coaches: From client-relationships

**Implementation Steps:**
1. Create progress API:
```typescript
export const getClientProgress = async (clientId: string) => {
  const { data } = await api.get('/progress', { params: { clientId } });
  return data;
};

export const getAchievements = async (clientId: string) => {
  const { data } = await api.get('/achievements', { params: { clientId } });
  return data;
};
```

---

### 2.7 ClientInvitations.tsx
**File:** `frontend/src/pages/client/ClientInvitations.tsx`
**Lines:** 220-353

**Current Hardcoded Data:**
```typescript
const mockInvitations: CoachInvitation[] = [
  { coachName: 'Dr. Sarah Johnson' },
  { coachName: 'Dr. Aisha Patel' }
];
```

**Real API Endpoint:** `GET /invitations?clientId={id}`

**Implementation Steps:**
1. Create invitations API:
```typescript
export const getClientInvitations = async (clientId: string) => {
  const { data } = await api.get('/invitations', {
    params: { clientId, type: 'received' }
  });
  return data.data || [];
};

export const respondToInvitation = async (invitationId: string, accept: boolean) => {
  const { data } = await api.post(`/invitations/${invitationId}/respond`, { accept });
  return data;
};
```

---

### 2.8 ClientAchievements.tsx
**File:** `frontend/src/pages/client/ClientAchievements.tsx`
**Lines:** 210-396

**Current Hardcoded Data:**
```typescript
const mockAchievements: Achievement[] = [/* ... */];
const mockStreaks: StreakData[] = [/* ... */];
const mockMilestones: Milestone[] = [/* ... */];
const mockLevel: Level = {/* ... */};
const mockStats = {/* ... */};
```

**Real API Endpoint:** `GET /achievements?clientId={id}` (progress-service)

**Achievement Entity:**
```typescript
{
  id: string;
  clientId: string;
  type: 'streak' | 'milestone' | 'goal_completed' | 'badge';
  title: string;
  description: string;
  earnedAt: Date;
  iconUrl?: string;
  category: string;
  points?: number;
}
```

**Implementation Steps:**
1. Fetch achievements from progress-service
2. Calculate streaks from session attendance data
3. Get level/stats from aggregated progress data

---

## Phase 3: Coach/Therapist Portal

### 3.1 CalendarPage.tsx
**File:** `frontend/src/pages/CalendarPage.tsx`
**Lines:** 71-108

**Current Hardcoded Data:**
```typescript
const mockPatients: Patient[] = [
  { id: '1', name: 'Sarah Johnson' },
];
const mockAppointments: Appointment[] = [
  {
    patientName: 'Sarah Johnson',
    meetingUrl: 'https://meet.example.com/session1',
  }
];
```

**Real API Endpoints:**
- Patients: `GET /patients?therapistId={id}`
- Appointments: `GET /appointments?therapistId={id}`

**Implementation Steps:**
1. Get coach ID from AuthContext
2. Fetch patients using existing `getMyPatients` API
3. Fetch appointments using existing `getAppointments` API
4. Transform to calendar event format

```typescript
const { user } = useAuth();
const coachId = user?.id ? parseInt(user.id) : undefined;

useEffect(() => {
  if (!coachId) return;

  Promise.all([
    getMyPatients(coachId),
    getAppointments({ therapistId: coachId })
  ]).then(([patients, appointments]) => {
    setPatients(patients.items);
    setAppointments(appointments);
  });
}, [coachId]);
```

---

### 3.2 TherapistHomePage.tsx
**File:** `frontend/src/pages/TherapistHomePage.tsx`
**Lines:** 67-127

**Current Hardcoded Data:**
```typescript
const mockAppointments: Appointment[] = [/* ... */];
const mockNotifications: Notification[] = [/* ... */];
const [therapistName] = useState('ד"ר כהן'); // Hardcoded Hebrew name
```

**Real API Endpoints:**
- Name: From AuthContext `user.name`
- Appointments: `GET /dashboard/appointments?coachId={id}`
- Notifications: `GET /notifications?userId={id}`

**Implementation Steps:**
1. Get therapist name from AuthContext
2. Use existing dashboard API for appointments
3. Create notifications API:
```typescript
export const getNotifications = async (userId: string) => {
  const { data } = await api.get('/notifications', { params: { userId } });
  return data.data || [];
};
```

---

### 3.3 TherapistBillingPage.tsx
**File:** `frontend/src/pages/TherapistBillingPage.tsx`
**Lines:** 132-144

**Current Hardcoded Data:**
```typescript
{ id: '1', name: 'Anna Goldberg', email: 'anna@example.com', phone: '050-123-4567' },
{ id: '2', name: 'Michael Rosen', email: 'michael@example.com', phone: '052-987-6543' },
{ id: '3', name: 'Rachel Levy', email: 'rachel@example.com', phone: '053-456-7890' },
```

**Real API Endpoint:** `GET /patients?therapistId={id}`

**Patient Entity Fields:**
```typescript
{
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  // Combined: name = `${firstName} ${lastName}`
}
```

**Implementation Steps:**
1. Fetch patients using `getMyPatients` with coach ID
2. Transform to billing client format
3. Add billing-specific data from billing-service if needed

---

## Phase 4: Admin Portal

### 4.1 SubscriptionManagementPage.tsx
**File:** `frontend/src/pages/admin/SubscriptionManagementPage.tsx`
**Lines:** 109-170

**Current Hardcoded Data:**
```typescript
// Subscription plans
priceMonthlyNis: 180,
priceMonthlyUsd: 50,

// User subscriptions
coachName: 'Dr. Sarah Cohen',
coachEmail: 'sarah@example.com',
```

**Real API Endpoints:**
- Plans: `GET /subscriptions/plans` (billing-service)
- User subscriptions: `GET /subscriptions?status=active` (billing-service)

**Implementation Steps:**
1. Create subscription API:
```typescript
export const getSubscriptionPlans = async () => {
  const { data } = await api.get('/subscriptions/plans');
  return data;
};

export const getActiveSubscriptions = async () => {
  const { data } = await api.get('/subscriptions', {
    params: { status: 'active' }
  });
  return data;
};
```

---

### 4.2 InvitationManagementPage.tsx
**File:** `frontend/src/pages/InvitationManagementPage.tsx`
**Lines:** 247-374

**Current Hardcoded Data:**
```typescript
const mockInvitations: CoachInvitation[] = [
  { coachName: 'Dr. Sarah Johnson' },
];
```

**Real API Endpoint:** `GET /invitations` (admin view)

**Implementation Steps:**
1. Create admin invitations API:
```typescript
export const getAllInvitations = async (filters?: {
  status?: string;
  coachId?: string;
  page?: number;
  limit?: number;
}) => {
  const { data } = await api.get('/admin/invitations', { params: filters });
  return data;
};
```

---

## Phase 5: Recording & AI Features

### 5.1 AppointmentRecordingManager.tsx
**File:** `frontend/src/components/AppointmentRecordingManager.tsx`
**Lines:** 197-287

**Current Hardcoded Data:**
```typescript
// Mock upload with progress simulation
// Mock AI summary generation
const mockSummary: SessionSummary = {/* ... */};
```

**Real API Endpoints:**
- Upload: `POST /files/upload` (files-service)
- AI Summary: `POST /ai/summarize` (ai-service)

**Implementation Steps:**
1. Use real file upload API with progress tracking
2. Call AI service for session summarization:
```typescript
export const generateSessionSummary = async (recordingId: string) => {
  const { data } = await api.post('/ai/summarize', { recordingId });
  return data;
};
```

---

### 5.2 CoachGoalPlanningPage.tsx
**File:** `frontend/src/pages/CoachGoalPlanningPage.tsx`
**Lines:** 334-551

**Current Hardcoded Data:**
```typescript
const mockTemplates: GoalTemplate[] = [/* ... */];
const mockPrograms: CoachingProgram[] = [/* ... */];
const mockMethodologies: GoalMethodology[] = [/* ... */];
```

**Real API Endpoints:**
- Templates: `GET /goals/templates`
- Programs: `GET /coaching/programs`
- Methodologies: Should be config/seed data

**Implementation Steps:**
1. Create goal templates API
2. Methodologies can be stored as static config or fetched from settings-service

---

## API Files to Create/Update

### New API Files:

1. **`frontend/src/api/coaches.ts`**
```typescript
import axios from 'axios';
import { API_URL } from '../env';

const api = axios.create({ baseURL: API_URL });

export const getCoaches = async (filters?: CoachFilters) => {...};
export const searchCoaches = async (params: SearchParams) => {...};
export const getCoachProfile = async (id: string) => {...};
export const getCoachAvailability = async (id: string, date: string) => {...};
```

2. **`frontend/src/api/goals.ts`**
```typescript
export const getClientGoals = async (clientId: string) => {...};
export const createGoal = async (goal: CreateGoalDto) => {...};
export const updateGoal = async (id: string, updates: Partial<Goal>) => {...};
```

3. **`frontend/src/api/progress.ts`**
```typescript
export const getClientProgress = async (clientId: string) => {...};
export const getAchievements = async (clientId: string) => {...};
export const createProgressUpdate = async (update: ProgressUpdate) => {...};
```

4. **`frontend/src/api/invitations.ts`**
```typescript
export const getClientInvitations = async (clientId: string) => {...};
export const getCoachInvitations = async (coachId: string) => {...};
export const respondToInvitation = async (id: string, accept: boolean) => {...};
```

5. **`frontend/src/api/notifications.ts`**
```typescript
export const getNotifications = async (userId: string) => {...};
export const markAsRead = async (notificationId: string) => {...};
```

### Update Existing API Files:

1. **`frontend/src/api/auth.ts`** - Add user data to response type
2. **`frontend/src/api/patients.ts`** - Already good, verify coachId filtering
3. **`frontend/src/api/appointments.ts`** - Already good
4. **`frontend/src/api/dashboard.ts`** - Already updated with coachId

---

## Implementation Priority

### Week 1: Authentication (Critical Path)
- [ ] Fix ClientLoginPage.tsx
- [ ] Fix ClientRegisterPage.tsx
- [ ] Fix AuthPage.tsx
- [ ] Update auth.ts API types

### Week 2: Client Portal Core
- [ ] Fix ClientDashboard.tsx
- [ ] Fix ClientAppointments.tsx
- [ ] Create coaches.ts API

### Week 3: Client Portal Extended
- [ ] Fix ClientBookingSystem.tsx
- [ ] Fix ClientGoals.tsx
- [ ] Fix CoachDiscovery.tsx
- [ ] Create goals.ts API

### Week 4: Coach Portal
- [ ] Fix CalendarPage.tsx
- [ ] Fix TherapistHomePage.tsx
- [ ] Fix TherapistBillingPage.tsx

### Week 5: Additional Features
- [ ] Fix ClientProgressSharing.tsx
- [ ] Fix ClientInvitations.tsx
- [ ] Fix ClientAchievements.tsx
- [ ] Create progress.ts and invitations.ts APIs

### Week 6: Admin & Recording
- [ ] Fix SubscriptionManagementPage.tsx
- [ ] Fix InvitationManagementPage.tsx
- [ ] Fix AppointmentRecordingManager.tsx
- [ ] Fix CoachGoalPlanningPage.tsx

---

## Testing Strategy

For each fix:
1. Unit test the new API function
2. Integration test the component with mocked API
3. E2E test the full flow
4. Verify data isolation (user only sees their own data)

---

## Notes

- All fixes should maintain backwards compatibility
- Use TypeScript interfaces for type safety
- Handle loading and error states
- Implement proper error messages for users
- Cache responses where appropriate (React Query or similar)
