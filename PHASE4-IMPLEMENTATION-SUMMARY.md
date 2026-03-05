# Phase 4 Implementation Summary: Coach Discovery & Connection System

**Status**: ✅ Completed
**Date**: 2026-02-11
**Services Modified**: coaches-service, client-relationships-service, api-gateway, frontend

---

## 4.1 Coach Search & List Endpoints (coaches-service)

### Modified Files:
- `services/coaches-service/src/coaches/coaches.controller.ts`
- `services/coaches-service/src/coaches/coaches.service.ts`

### New Files:
- `services/coaches-service/src/coaches/dto/search-coaches.dto.ts`

### Implementation Details:

**Controller Changes:**
- ✅ Added `GET /coaches/search` endpoint (BEFORE :id routes - critical NestJS ordering)
- ✅ Added `GET /coaches` endpoint for listing all coaches
- ✅ Applied `JwtAuthGuard` to protect endpoints
- ✅ Both routes accept `SearchCoachesDto` query parameters

**Service Changes:**
- ✅ Renamed `searchCoachs()` to `searchCoaches()` for correct spelling
- ✅ Added text search on `name` and `bio` fields with ILIKE
- ✅ Properly escaped LIKE wildcards (`%`, `_`, `\`) to prevent SQL injection
- ✅ Added filtering by `specializations` (array overlap)
- ✅ Added filtering by `languages` (array overlap)
- ✅ Added filtering by `acceptingNewClients` boolean
- ✅ Added sorting by `experience`, `name`, `rating`, `updated`
- ✅ Added pagination with `page` and `limit` (max 100 per page)
- ✅ Returns `{ profiles, total, page, limit }` structure

**DTO Features:**
- ✅ Optional text search parameter
- ✅ Array filters with proper transformation
- ✅ Sort options enum validation
- ✅ Pagination with sensible defaults (page=1, limit=20)
- ✅ Class-validator decorators for all fields

---

## 4.2 API Gateway Coaches Proxy

### Modified Files:
- `services/api-gateway/src/app.module.ts`
- `services/api-gateway/src/coaches/coaches.controller.ts`
- `services/api-gateway/src/coaches/coaches.service.ts`

### Implementation Details:

**App Module:**
- ✅ Enabled `CoachesModule` in imports (was commented out)
- ✅ Enabled `CoachesService` in providers (was commented out)

**Controller Changes:**
- ✅ Added `GET /coaches/search` route (BEFORE :id routes)
- ✅ Added `GET /coaches` list route
- ✅ Both routes proxy to coaches-service

**Service Changes:**
- ✅ Added `searchCoaches()` method to proxy GET /coaches with query params
- ✅ Properly forwards query parameters to coaches-service
- ✅ Uses configurable `THERAPISTS_URL` environment variable (defaults to localhost:3013)

---

## 4.3 Connection Request Endpoints (client-relationships-service)

### Modified Files:
- `services/client-relationships-service/src/controllers/relationship.controller.ts`
- `services/client-relationships-service/src/services/relationship.service.ts`

### New Files:
- `services/client-relationships-service/src/dto/create-relationship.dto.ts`
- `services/api-gateway/src/relationships/relationships.module.ts`
- `services/api-gateway/src/relationships/relationships.controller.ts`
- `services/api-gateway/src/relationships/relationships.service.ts`

### Implementation Details:

**Relationship Controller (Service):**
- ✅ `POST /relationships` - Create connection request
  - Accepts `CreateRelationshipDto` with clientId, coachId, message, etc.
  - Sets `invitedBy` to current authenticated user
  - Creates relationship with PENDING status
- ✅ `GET /relationships/client/:clientId` - Get all relationships for a client
  - Optional `status` query param filter
  - Static route BEFORE :id (critical NestJS ordering)
- ✅ `GET /relationships/coach/:coachId` - Get all relationships for a coach
  - Optional `status` query param filter
  - Static route BEFORE :id
- ✅ `PUT /relationships/:id/status` - Update relationship status
  - Accepts `{ status, reason }` body
  - Handles ACTIVE (accept), TERMINATED (reject) statuses
  - Delegates to appropriate service methods
- ✅ `GET /relationships/:id` - Get relationship by ID
  - Includes full relationship data with relations

**Relationship Service:**
- ✅ Already had comprehensive implementation:
  - `createRelationship()` - Validates client/coach exist, checks availability
  - `acceptRelationship()` - Updates to ACTIVE status
  - `rejectRelationship()` - Updates to TERMINATED with reason
  - `findRelationships()` - Query with multiple filters
  - `terminateRelationship()` - Revokes all permissions
  - Default permission creation based on access level

**CreateRelationshipDto:**
- ✅ UUID validation for clientId, coachId, invitedBy
- ✅ Enum validation for relationshipType and dataAccessLevel
- ✅ Optional arrays for focusAreas
- ✅ Optional JSON fields for preferences, privacy, programs
- ✅ API documentation with Swagger decorators

**API Gateway Proxy:**
- ✅ Created `RelationshipsModule` with HTTP proxy pattern
- ✅ Controller mirrors service endpoints with same route structure
- ✅ Service proxies to `CLIENT_RELATIONSHIPS_URL` (defaults to localhost:3014)
- ✅ Forwards Authorization headers for authentication
- ✅ Added to app.module.ts imports

---

## 4.4 Frontend API Client for Coaches

### New Files:
- `frontend/src/api/coaches.ts`

### Implementation Details:

**Coach Search & Discovery:**
- ✅ `searchCoaches(params)` - Search with filters
  - Accepts all SearchCoachesParams (search, specializations, languages, etc.)
  - Returns `{ profiles, total, page, limit }`
  - Includes trace ID for logging
- ✅ `getCoachProfile(id)` - Get individual coach profile
  - Fetches public profile data
  - Includes verification status

**Connection Management:**
- ✅ `requestConnection(coachId, message)` - Request coach connection
  - Auto-fills clientId from localStorage
  - Sets default relationshipType and dataAccessLevel
  - Sends optional invitation message
- ✅ `getMyRelationships(status?)` - Get current user's relationships
  - Auto-fills clientId from localStorage
  - Optional status filter
- ✅ `updateRelationshipStatus(id, status, reason)` - Accept/reject relationships
  - Supports 'active' (accept) and 'terminated' (reject)
  - Optional reason for rejection

**TypeScript Interfaces:**
- ✅ `CoachProfile` - Full coach profile structure
- ✅ `SearchCoachesParams` - Search filter parameters
- ✅ `CoachesSearchResponse` - Paginated search results

**Patterns Followed:**
- ✅ Uses `apiClient` from existing API layer
- ✅ UUID trace IDs for request tracking
- ✅ Console logging for debugging
- ✅ Follows existing `appointments.ts` patterns

---

## Build Verification

All services successfully compile:

```bash
✅ yarn workspace @clinic/common build
✅ cd services/coaches-service && yarn build
✅ cd services/client-relationships-service && yarn build
✅ cd services/api-gateway && yarn build
```

---

## Environment Variables

Required environment variables for deployment:

```env
# Coaches Service (API Gateway)
THERAPISTS_URL=http://coaches-service:3013

# Client Relationships Service (API Gateway)
CLIENT_RELATIONSHIPS_URL=http://client-relationships-service:3014
```

---

## Next Steps (Phase 5 - Optional)

### Frontend UI Components:
1. **Coach Discovery Page** (`/find-coaches`)
   - Search bar with text input
   - Filter chips for specializations, languages
   - Sorting dropdown (experience, rating, name)
   - Coach cards with profile preview
   - "Request Connection" button

2. **Coach Profile Detail Page** (`/coaches/:id`)
   - Full bio and credentials display
   - Verification badge
   - Specializations and expertise areas
   - Years of experience
   - Media gallery (if public)
   - "Request Connection" CTA

3. **My Coaches Page** (`/client/my-coaches`)
   - List of all relationships (active, pending)
   - Status badges (pending, active, terminated)
   - Accept/Reject buttons for pending invitations
   - View relationship details

4. **Connection Request Dialog**
   - Optional message textarea
   - Confirmation of relationship type
   - Submit/Cancel actions

### Translation Keys (i18n):
```typescript
// Add to frontend/src/i18n/translations/en.ts
coaches: {
  search: {
    title: 'Find a Coach',
    placeholder: 'Search by name or specialty...',
    filters: {
      specializations: 'Specializations',
      languages: 'Languages',
      acceptingClients: 'Accepting New Clients'
    },
    sortBy: {
      label: 'Sort By',
      experience: 'Experience',
      rating: 'Rating',
      name: 'Name'
    }
  },
  profile: {
    verified: 'Verified Coach',
    experience: '{years} years experience',
    acceptingClients: 'Accepting New Clients',
    notAccepting: 'Not Accepting Clients',
    requestConnection: 'Request Connection'
  },
  relationships: {
    myCoaches: 'My Coaches',
    pending: 'Pending',
    active: 'Active',
    accept: 'Accept',
    reject: 'Reject',
    status: {
      pending: 'Invitation Pending',
      active: 'Active Relationship',
      terminated: 'Ended'
    }
  }
}
```

---

## Security Considerations

✅ **Implemented:**
- JwtAuthGuard on all endpoints
- UUID validation with ParseUUIDPipe
- SQL injection prevention (LIKE escape)
- Authorization header forwarding
- Input validation with class-validator

⚠️ **Recommendations:**
- Add permission checks (coach can't see other coaches' relationships)
- Rate limiting on connection requests (prevent spam)
- Notification system for new connection requests
- Client consent tracking for data sharing permissions

---

## Database Schema Notes

**Existing Tables (No Migration Required):**
- ✅ `coach_profiles` - Already exists in coaches-service
- ✅ `client_coach_relationships` - Already exists in client-relationships-service
- ✅ `relationship_permissions` - Already exists in client-relationships-service
- ✅ `clients` - Already exists in client-relationships-service
- ✅ `coaches` - Already exists in client-relationships-service

**Auto-Sync Enabled:**
All services use TypeORM auto-sync in development, so entity changes are automatically applied.

---

## API Endpoints Summary

### Coaches Service (Port 3013)
```
GET    /coaches                 - Search/list coaches (paginated)
GET    /coaches/search          - Search coaches (same as above)
GET    /coaches/:id/profile     - Get coach profile
PUT    /coaches/:id/profile     - Update coach profile (owner only)
```

### Client Relationships Service (Port 3014)
```
POST   /relationships                     - Create connection request
GET    /relationships/client/:clientId    - Get client's relationships
GET    /relationships/coach/:coachId      - Get coach's relationships
PUT    /relationships/:id/status          - Accept/reject relationship
GET    /relationships/:id                 - Get relationship details
```

### API Gateway (Port 4000) - Proxies All Above
```
GET    /coaches                           → coaches-service
GET    /coaches/search                    → coaches-service
GET    /coaches/:id/profile               → coaches-service
PUT    /coaches/:id/profile               → coaches-service

POST   /relationships                     → client-relationships-service
GET    /relationships/client/:clientId    → client-relationships-service
GET    /relationships/coach/:coachId      → client-relationships-service
PUT    /relationships/:id/status          → client-relationships-service
GET    /relationships/:id                 → client-relationships-service
```

---

## Critical NestJS Route Ordering

⚠️ **IMPORTANT:** Static routes MUST be declared BEFORE parameterized `:id` routes in all controllers!

**Correct Order:**
```typescript
@Get('search')         // ✅ Static - FIRST
@Get()                 // ✅ Root - SECOND
@Get('client/:id')     // ✅ Static prefix - THIRD
@Get(':id')            // ✅ Parameterized - LAST
```

**Wrong Order (will break):**
```typescript
@Get(':id')            // ❌ Catches everything including "search"
@Get('search')         // ❌ Never reached
```

This has been correctly implemented in all modified controllers.

---

## Files Modified/Created

### Coaches Service
- ✏️ `src/coaches/coaches.controller.ts`
- ✏️ `src/coaches/coaches.service.ts`
- ➕ `src/coaches/dto/search-coaches.dto.ts`

### Client Relationships Service
- ✏️ `src/controllers/relationship.controller.ts`
- ✏️ `src/services/relationship.service.ts`
- ➕ `src/dto/create-relationship.dto.ts`

### API Gateway
- ✏️ `src/app.module.ts`
- ✏️ `src/coaches/coaches.controller.ts`
- ✏️ `src/coaches/coaches.service.ts`
- ➕ `src/relationships/relationships.module.ts`
- ➕ `src/relationships/relationships.controller.ts`
- ➕ `src/relationships/relationships.service.ts`

### Frontend
- ➕ `src/api/coaches.ts`

**Total: 13 files (6 modified, 7 created)**

---

## Testing Commands

```bash
# Build verification (all pass ✅)
yarn workspace @clinic/common build
cd services/coaches-service && yarn build
cd services/client-relationships-service && yarn build
cd services/api-gateway && yarn build

# Start services
docker compose up coaches-service client-relationships-service api-gateway -d

# Test coach search
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/coaches?search=life&limit=10"

# Test connection request
curl -X POST http://localhost:4000/relationships \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "uuid-here",
    "coachId": "uuid-here",
    "relationshipType": "secondary",
    "dataAccessLevel": "limited",
    "invitationMessage": "I would like to work with you"
  }'

# Test get client relationships
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/relationships/client/{clientId}"
```

---

**Implementation Complete! ✅**

All Phase 4 objectives have been successfully implemented and verified to compile. The coach discovery and connection system is now ready for integration testing and frontend UI development.
