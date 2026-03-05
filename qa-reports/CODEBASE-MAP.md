# Codebase Map

## 1. Project Structure
- **Frontend**: React 18 + Vite + Material UI (`frontend/`)
- **Backend**: NestJS Microservices (`services/`)
- **Infrastructure**: Docker Compose, NATS (Messaging), Postgres (DB), Redis (Cache), MinIO (Storage)
- **Repo Root**:
    - `docker-compose.yml` (Main orchestration)
    - `.env` (Environment variables)

## 2. Microservices
| Service | Port (Internal) | Description |
| :--- | :--- | :--- |
| `api-gateway` | 4000 | Entry point for frontend, routing, aggregation |
| `auth-service` | 3001 | Authentication, JWT, Registration, MFA |
| `appointments-service` | 3002 | Scheduling, Appointments, Calendar |
| `files-service` | 3003 | File storage (MinIO), Recordings |
| `notifications-service` | 3004 | Email, SMS, WhatsApp |
| `ai-service` | 3005 | AI Summaries, Transcription (OpenAI/Whisper) |
| `notes-service` | 3006 | Session notes |
| `analytics-service` | 3007 | Business intelligence, stats |
| `settings-service` | 3008 | System settings |
| `billing-service` | 3009 | Invoicing, Payments (Stripe/Tranzilla) |
| `google-integration-service` | 3012 | Google Calendar/Gmail Sync |
| `coaches-service` | 3013 | Coach profiles and management |
| `client-relationships-service` | 3014 | Client-Coach relationships, permissions |

## 3. Frontend Routes (`frontend/src/App.tsx`)
### Public
- `/login`, `/register`, `/auth`
- `/reset/request`, `/reset/confirm`
- `/client/login`, `/client/register` (Client Portal)

### Private (Therapist/Admin)
- `/dashboard`
- `/calendar`
- `/patients`, `/patients/new`, `/patients/:id`
- `/appointments`, `/appointments/new`, `/appointments/:id`
- `/billing`
- `/settings`
- `/admin/*` (Admin Dashboard)

### Client Portal (Private)
- `/client/dashboard`
- `/client/appointments`
- `/client/goals`
- `/client/booking`
- `/client/progress`

## 4. Key Workflows

### Client Creation
1.  **Self-Registration (Type A - "Client")**
    - **URL**: `/client/register`
    - **Frontend API**: `auth.ts` -> `POST /auth/register` (Auth Service)
    - **Backend**: `auth-service` -> Creates User (Role: client) in Postgres.
    - **Result**: Client has login credentials immediately.

2.  **Therapist-Added (Type B - "Patient")**
    - **URL**: `/patients/new`
    - **Frontend API**: `patients.ts` -> `POST /patients` (via `THERAPIST_SERVICE_URL` -> Gateway `PatientsController`)
    - **Backend**: `api-gateway` -> `PatientsController` -> `PatientsService`.
    - **CRITICAL FINDING**: `PatientsService` uses an **IN-MEMORY ARRAY** (`const patients: Patient[] = []`) to store patient relationships!
        - It *does* call `auth-service` to create a User with a random password.
        - But the application-level "Patient" record (linking to Coach) is ephemeral in the Gateway's memory.
        - **Risk**: Restarting the gateway will lose the list of "Therapist-Added" clients, extracting them from the therapist's view (though the User record remains in Auth DB).

### Authentication
- **Service**: `auth-service`
- **Flow**: Login -> JWT Access Token + Refresh Token
- **Roles**: `admin`, `coach`, `client`

### Billing
- **Service**: `billing-service`
- **Integrations**: Stripe, Tranzilla, Cardcom
- **Entities**: `SubscriptionPlan`, `SubscriptionInvoice`, `PaymentTransaction`

### Appointments & Sessions
- **Service**: `appointments-service`
- **Features**: In-person, Online (Video), Recording
- **Entities**: `Appointment`, `SessionRecording`, `SessionNote`

## 5. Deployment & Config
- **Ports**: 
    - Frontend: 5173 (Dev), 80 (Prod Nginx)
    - API Gateway: 4000
    - MailDev: 1080 (UI), 1025 (SMTP)
    - MinIO: 9001 (Console), 9000 (API)
- **Env Vars**: 
    - `JWT_SECRET`, `POSTGRES_PASSWORD`
    - `OPENAI_API_KEY`
    - `TWILIO_*`, `STRIPE_*`, `GOOGLE_*`

## 6. Observations & TODOs
- **Gateway Pattern**: Most frontend requests go through API Gateway (port 4000).
- **Type B Clients**: **CRITICAL**: Stored in-memory in API Gateway. Non-persistent. This is a major issue for a "real" system simulation if the gateway restarts.
- **Microservices**: High complexity. Distributed data. Latency and sync issues (NATS) should be watched.
