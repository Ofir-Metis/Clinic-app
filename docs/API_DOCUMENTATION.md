# 🔌 API Documentation - Healthcare Platform

## 📋 Overview

The Healthcare Platform provides a comprehensive REST API for managing clinic operations, client interactions, and healthcare workflows. All APIs are HIPAA-compliant with full audit logging and secure authentication.

---

## 🏗️ **Microservices Architecture**

### 🌐 **API Gateway** (Port 4000)
**Main entry point for all client requests**

- **Purpose**: Request routing, authentication, rate limiting
- **Health Check**: `GET /health`
- **API Docs**: `GET /api-docs` (Swagger/OpenAPI)
- **Base URL**: `https://api.yourdomain.com`

```bash
# Health check
curl https://api.yourdomain.com/health

# API documentation
curl https://api.yourdomain.com/api-docs
```

---

## 🔐 **Authentication Service** (Port 3001)

### **Service Overview**
Manages user authentication, authorization, and multi-factor authentication for all platform users.

#### **Core Endpoints**

##### **POST /auth/register**
Register a new user (client, coach, or admin)

```bash
curl -X POST https://api.yourdomain.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "client",
    "phoneNumber": "+1234567890"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "usr_12345",
    "email": "client@example.com",
    "role": "client",
    "mfaEnabled": false
  },
  "message": "Registration successful. Please verify your email."
}
```

##### **POST /auth/login**
Authenticate user and get JWT token

```bash
curl -X POST https://api.yourdomain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "SecurePassword123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "usr_12345",
    "email": "client@example.com",
    "role": "client",
    "firstName": "John",
    "lastName": "Doe"
  },
  "expiresIn": 3600
}
```

##### **POST /auth/refresh**
Refresh expired JWT token

```bash
curl -X POST https://api.yourdomain.com/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "refresh_token_here"
  }'
```

##### **POST /auth/mfa/setup**
Setup multi-factor authentication

```bash
curl -X POST https://api.yourdomain.com/auth/mfa/setup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "qrCodeUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "secret": "JBSWY3DPEHPK3PXP",
  "backupCodes": ["123456", "789012", "345678"]
}
```

---

## 📅 **Appointments Service** (Port 3002)

### **Service Overview**
Manages appointment scheduling, calendar integration, and booking workflows with Google Calendar sync.

#### **Core Endpoints**

##### **GET /appointments**
Get user's appointments with filtering and pagination

```bash
curl -X GET "https://api.yourdomain.com/appointments?page=1&limit=10&status=scheduled" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "appointments": [
    {
      "id": "apt_12345",
      "clientId": "usr_12345",
      "coachId": "usr_67890",
      "scheduledAt": "2024-02-01T14:00:00Z",
      "duration": 60,
      "status": "scheduled",
      "type": "coaching_session",
      "notes": "Focus on anxiety management",
      "googleEventId": "google_event_123"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalCount": 25,
    "hasNext": true
  }
}
```

##### **POST /appointments**
Create new appointment

```bash
curl -X POST https://api.yourdomain.com/appointments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "coachId": "usr_67890",
    "scheduledAt": "2024-02-01T14:00:00Z",
    "duration": 60,
    "type": "coaching_session",
    "notes": "Initial consultation",
    "syncWithGoogle": true
  }'
```

##### **PUT /appointments/:id**
Update existing appointment

```bash
curl -X PUT https://api.yourdomain.com/appointments/apt_12345 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduledAt": "2024-02-01T15:00:00Z",
    "notes": "Rescheduled - focus on stress management"
  }'
```

##### **GET /appointments/:id/availability**
Check coach availability for booking

```bash
curl -X GET "https://api.yourdomain.com/appointments/usr_67890/availability?date=2024-02-01" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📁 **Files Service** (Port 3003)

### **Service Overview**
Handles secure file uploads, session recordings, and media processing with chunked uploads for large files.

#### **Core Endpoints**

##### **POST /files/upload**
Upload session recording or document (supports chunked uploads up to 500MB)

```bash
curl -X POST https://api.yourdomain.com/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@session_recording.mp4" \
  -F "appointmentId=apt_12345" \
  -F "fileType=session_recording"
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file_12345",
    "fileName": "session_recording.mp4",
    "fileSize": 157286400,
    "fileType": "session_recording",
    "mimeType": "video/mp4",
    "uploadedAt": "2024-02-01T14:30:00Z",
    "url": "https://secure-storage.yourdomain.com/files/file_12345",
    "appointmentId": "apt_12345"
  }
}
```

##### **GET /files/:id**
Get file metadata and secure download URL

```bash
curl -X GET https://api.yourdomain.com/files/file_12345 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

##### **POST /files/:id/process**
Trigger AI processing (transcription, analysis)

```bash
curl -X POST https://api.yourdomain.com/files/file_12345/process \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "processingType": "transcription",
    "options": {
      "language": "en",
      "includeAnalysis": true
    }
  }'
```

---

## 🔔 **Notifications Service** (Port 3004)

### **Service Overview**
Manages email and SMS notifications, appointment reminders, and system alerts via Twilio and SMTP.

#### **Core Endpoints**

##### **POST /notifications/send**
Send notification to user

```bash
curl -X POST https://api.yourdomain.com/notifications/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "usr_12345",
    "type": "appointment_reminder",
    "channels": ["email", "sms"],
    "data": {
      "appointmentId": "apt_12345",
      "scheduledAt": "2024-02-01T14:00:00Z"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "notif_12345",
      "channel": "email",
      "status": "sent",
      "sentAt": "2024-01-31T10:00:00Z"
    },
    {
      "id": "notif_12346", 
      "channel": "sms",
      "status": "sent",
      "sentAt": "2024-01-31T10:00:00Z"
    }
  ]
}
```

##### **GET /notifications/preferences/:userId**
Get user notification preferences

```bash
curl -X GET https://api.yourdomain.com/notifications/preferences/usr_12345 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

##### **PUT /notifications/preferences/:userId**
Update notification preferences

```bash
curl -X PUT https://api.yourdomain.com/notifications/preferences/usr_12345 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailReminders": true,
    "smsReminders": false,
    "appointmentReminders": "24_hours",
    "marketingEmails": false
  }'
```

---

## 🤖 **AI Service** (Port 3005)

### **Service Overview**
Integrates OpenAI GPT-4 for session analysis, Whisper for transcription, and provides AI-powered insights.

#### **Core Endpoints**

##### **POST /ai/analyze**
Analyze session content with GPT-4

```bash
curl -X POST https://api.yourdomain.com/ai/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "apt_12345",
    "content": "Session transcript or notes",
    "analysisType": "session_summary",
    "options": {
      "includeRecommendations": true,
      "focusAreas": ["anxiety", "coping_strategies"]
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "id": "analysis_12345",
    "summary": "Client showed significant progress in anxiety management...",
    "keyInsights": [
      "Improved coping strategies",
      "Better emotional regulation",
      "Increased self-awareness"
    ],
    "recommendations": [
      "Continue mindfulness practices",
      "Explore deeper triggers next session"
    ],
    "sentiment": "positive",
    "progressScore": 8.2
  }
}
```

##### **POST /ai/transcribe**
Transcribe audio/video file using Whisper

```bash
curl -X POST https://api.yourdomain.com/ai/transcribe \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "file_12345",
    "language": "en",
    "options": {
      "includeSpeakerLabels": true,
      "includeTimestamps": true
    }
  }'
```

---

## 📝 **Notes Service** (Port 3006)

### **Service Overview**
Manages clinical notes, session documentation, and client progress tracking with HIPAA-compliant storage.

#### **Core Endpoints**

##### **GET /notes**
Get notes with filtering and search

```bash
curl -X GET "https://api.yourdomain.com/notes?appointmentId=apt_12345&clientId=usr_12345" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

##### **POST /notes**
Create session note

```bash
curl -X POST https://api.yourdomain.com/notes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "apt_12345",
    "clientId": "usr_12345",
    "content": "Client demonstrated improved anxiety management techniques...",
    "type": "session_note",
    "tags": ["anxiety", "progress", "coping_strategies"],
    "isPrivate": true
  }'
```

---

## 📊 **Analytics Service** (Port 3007)

### **Service Overview** 
Provides business intelligence, reporting, and analytics for clinic operations and client outcomes.

#### **Core Endpoints**

##### **GET /analytics/dashboard**
Get dashboard metrics

```bash
curl -X GET "https://api.yourdomain.com/analytics/dashboard?period=30d" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "totalAppointments": 156,
    "completedSessions": 142,
    "activeClients": 87,
    "revenue": 12450.00,
    "averageSessionDuration": 52,
    "clientSatisfaction": 4.8,
    "trends": {
      "appointmentsGrowth": 15.2,
      "revenueGrowth": 8.7
    }
  }
}
```

---

## ⚙️ **Settings Service** (Port 3008)

### **Service Overview**
Manages system configuration, user preferences, and clinic-wide settings.

#### **Core Endpoints**

##### **GET /settings/clinic**
Get clinic configuration

```bash
curl -X GET https://api.yourdomain.com/settings/clinic \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

##### **PUT /settings/clinic**
Update clinic settings

```bash
curl -X PUT https://api.yourdomain.com/settings/clinic \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clinicName": "Wellness Center",
    "timezone": "America/New_York",
    "defaultSessionDuration": 60,
    "businessHours": {
      "monday": {"start": "09:00", "end": "17:00"},
      "tuesday": {"start": "09:00", "end": "17:00"}
    }
  }'
```

---

## 💳 **Billing Service** (Port 3009)

### **Service Overview**
Handles payments, invoicing, and billing with Israeli compliance (Tranzilla, CardCom) and international support (Stripe).

#### **Core Endpoints**

##### **POST /billing/payment**
Process payment

```bash
curl -X POST https://api.yourdomain.com/billing/payment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "apt_12345",
    "amount": 150.00,
    "currency": "USD",
    "paymentMethod": "stripe",
    "paymentDetails": {
      "cardToken": "tok_visa",
      "saveCard": true
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "pay_12345",
    "amount": 150.00,
    "currency": "USD",
    "status": "succeeded",
    "paidAt": "2024-02-01T15:30:00Z",
    "receiptUrl": "https://secure.yourdomain.com/receipts/pay_12345"
  }
}
```

---

## 🔐 **Authentication & Security**

### **JWT Token Authentication**
All API endpoints require authentication via JWT Bearer token:

```bash
curl -X GET https://api.yourdomain.com/appointments \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### **Rate Limiting**
- **Default**: 1000 requests per 15-minute window
- **File Uploads**: 10 uploads per hour per user
- **AI Processing**: 50 requests per hour per user

### **CORS Configuration**
Configured for frontend domains:
- Production: `https://yourdomain.com`
- Staging: `https://staging.yourdomain.com`
- Development: `http://localhost:5173`

---

## 📱 **WebSocket Real-time Features**

### **Connection**
```javascript
const socket = new WebSocket('wss://api.yourdomain.com');

// Authenticate
socket.send(JSON.stringify({
  type: 'auth',
  token: 'your_jwt_token'
}));
```

### **Real-time Events**
- **Appointment Updates**: `appointment_updated`, `appointment_cancelled`
- **File Processing**: `file_processing_complete`, `transcription_ready`
- **Notifications**: `new_notification`, `reminder_sent`
- **System Events**: `maintenance_mode`, `system_alert`

---

## 🧪 **Testing the API**

### **Postman Collection**
Import our Postman collection for easy API testing:

```bash
# Download collection
curl -O https://api.yourdomain.com/docs/postman-collection.json

# Import into Postman and configure environment variables:
# - base_url: https://api.yourdomain.com
# - jwt_token: your_authentication_token
```

### **API Testing Script**
```bash
# Run comprehensive API tests
./scripts/test-api.sh

# Test specific service
./scripts/test-api.sh auth-service
./scripts/test-api.sh appointments-service
```

---

## 🔍 **Error Handling**

### **Standard Error Response**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  },
  "requestId": "req_12345"
}
```

### **HTTP Status Codes**
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (invalid/expired token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **429**: Rate Limited
- **500**: Internal Server Error

---

## 📚 **Additional Resources**

### **Interactive API Documentation**
- **Swagger UI**: https://api.yourdomain.com/api-docs
- **Redoc**: https://api.yourdomain.com/redoc

### **API Versioning**
- **Current Version**: v1
- **Base URL**: https://api.yourdomain.com/v1
- **Versioning Strategy**: URL versioning for major changes

### **SDKs & Libraries**
- **JavaScript/TypeScript**: `@clinic-app/api-client`
- **Python**: `clinic-app-python`
- **React Hooks**: `@clinic-app/react-hooks`

```bash
# Install JavaScript SDK
npm install @clinic-app/api-client

# Example usage
import { ClinicApi } from '@clinic-app/api-client';

const api = new ClinicApi({
  baseUrl: 'https://api.yourdomain.com',
  accessToken: 'your_jwt_token'
});

const appointments = await api.appointments.list();
```

---

## 🏥 **HIPAA Compliance Notes**

### **Audit Logging**
All API requests are logged with:
- User ID and role
- Endpoint accessed
- Timestamp and IP address
- Request/response data (PII masked)

### **Data Encryption**
- **In Transit**: TLS 1.3 encryption for all API calls
- **At Rest**: AES-256 encryption for all stored data
- **PII Handling**: Personal data encrypted with separate keys

### **Access Controls**
- **Role-based Access**: Client, coach, admin, super_admin roles
- **Data Isolation**: Users can only access their own data
- **Admin Audit**: All admin actions logged and monitored

---

**🔌 Your Healthcare Platform API is production-ready with enterprise security and HIPAA compliance! 🌟**