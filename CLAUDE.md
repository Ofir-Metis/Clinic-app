# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `./scripts/dev.sh` - Start all services using Docker Compose
- `docker compose up --build` - Alternative to start all services
- `yarn workspace @clinic/common build` - Build shared common library (required first)
- `yarn workspace <service-name> start:dev` - Run individual service in development mode
- `cd frontend && yarn dev` - Run frontend development server on port 5173

### Testing and Quality
- `./scripts/test.sh` - Run linting and tests across all workspaces
- `yarn lint` - Run ESLint across all workspaces  
- `yarn test` - Run Jest tests across all workspaces
- `yarn workspace <service-name> test` - Run tests for specific service
- `yarn format` - Format code with Prettier

### Individual Service Commands
- `yarn workspace <service-name> build` - Build specific service
- `yarn workspace <service-name> start` - Start service in production mode
- `yarn workspace <service-name> migration:generate` - Generate new TypeORM migration
- `yarn workspace <service-name> migration:run` - Run pending migrations
- `yarn workspace <service-name> migration:revert` - Revert last migration
- Services include: auth-service, appointments-service, files-service, notifications-service, ai-service, notes-service, analytics-service, settings-service, api-gateway

### Debugging and Development
- `docker compose logs <service-name>` - View logs for specific service
- `docker compose logs -f` - Follow all service logs in real-time
- `yarn workspace <service-name> start:debug` - Start service with debugging enabled
- Database connection via `psql -h localhost -p 5432 -U postgres -d clinic_db`

## Architecture Overview

This is a microservices-based clinic management application with the following structure:

### Core Architecture
- **Frontend**: React + Vite + Material-UI (port 5173)
- **API Gateway**: NestJS GraphQL gateway (port 4000) - main entry point
- **Backend Services**: NestJS microservices communicating via NATS
- **Database**: PostgreSQL (port 5432)
- **File Storage**: MinIO S3-compatible storage (port 9000)
- **Email**: MailDev for development (port 1080/1025)

### Service Structure
```
services/
├── api-gateway/         # Main GraphQL API gateway (port 4000)
├── auth-service/        # Authentication & user management (port 3001)
├── appointments-service/ # Scheduling & appointments (port 3002)
├── files-service/       # File upload & management (port 3003)
├── notifications-service/ # Notifications & messaging (port 3004)
├── ai-service/          # OpenAI integration (port 3005)
├── notes-service/       # Session notes (port 3006)
├── analytics-service/   # Analytics & reporting (port 3007)
├── settings-service/    # User settings (port 3008)
└── therapists-service/  # Therapist profiles
```

### Key Dependencies
- **@clinic/common**: Shared utilities (build this first)
- **NATS**: Message broker for inter-service communication
- **TypeORM**: Database ORM with PostgreSQL
- **JWT**: Authentication across services
- **Twilio**: SMS notifications
- **OpenAI**: AI assistant features

## Important Development Notes

### Prerequisites
- Node.js 20+ (use `nvm install 20 && nvm use 20`)
- Yarn package manager
- Docker and Docker Compose
- Environment variables from `.env` file (copy from `.env.example`)

### Common Development Workflow
1. Build shared library: `yarn workspace @clinic/common build`
2. Start infrastructure: `docker compose up postgres nats minio maildev`
3. Start services: `./scripts/dev.sh` or individual services
4. Frontend development: `cd frontend && yarn dev`

### Testing Requirements
- All services have Jest test suites
- 80% code coverage threshold enforced
- Tests require specific environment variables (see scripts/test.sh)
- Use `yarn workspace <service> test` for individual service testing

### Service Communication
- Services communicate via NATS message broker
- API Gateway aggregates all services into single GraphQL endpoint
- JWT tokens passed between services for authentication
- Each service has health check endpoints at `/health`

### Database & Migrations
- PostgreSQL database shared across services
- TypeORM entities defined per service
- Migration commands available per service (e.g., `yarn workspace auth-service migration:run`)

### File Structure Patterns
- Each service follows NestJS module structure
- DTOs in `dto/` folders for request/response validation
- Entities in root or dedicated folders
- Controllers handle HTTP/GraphQL endpoints
- Services contain business logic
- Guards for JWT authentication where needed

### Critical Development Patterns
- **Shared Library First**: Always build `@clinic/common` before any service development
- **Environment Variables**: Copy `.env.example` to `.env` and configure all required variables
- **Service Dependencies**: API Gateway depends on all backend services; start infrastructure first
- **Database Sync**: TypeORM synchronization is enabled - entities auto-create tables
- **NATS Communication**: Services use async messaging for non-critical operations
- **JWT Flow**: Frontend → API Gateway → Service (JWT passed through headers)
- **Health Checks**: All services expose `/health` endpoints for monitoring
- **Error Handling**: Consistent exception filters across all services via @clinic/common

## 🎨 Wellness-Focused Design System

This clinic management app uses a comprehensive design system tailored for mental health professionals and self-development therapists. The design emphasizes trust, healing, growth, and professional warmth.

### Color Palette & Psychology

#### Primary Colors (Trust & Healing)
- **Primary**: `#2E7D6B` - Deep teal representing trust, healing, and balance
- **Primary Light**: `#4A9B8A` - For hover states and light backgrounds
- **Primary Dark**: `#1F5A4E` - For emphasis and depth

#### Secondary Colors (Wisdom & Transformation) 
- **Secondary**: `#8B5A87` - Muted purple for wisdom and transformation
- **Secondary Light**: `#A47BA0` - For accents and highlights
- **Secondary Dark**: `#6B446A` - For contrast and depth

#### Accent Colors (Optimism & Energy)
- **Accent**: `#F4A261` - Warm orange for optimism and energy
- **Accent Light**: `#F6B685` - For gentle emphasis
- **Accent Dark**: `#E8934A` - For warnings and calls-to-action

#### Wellness Backgrounds
- **Wellness Light**: `#F0F8F4` - Very light mint for main backgrounds
- **Wellness Ultra Light**: `#FAFCFB` - For subtle contrast areas

#### Glass Effects (Glassmorphism)
- **Light Glass**: `rgba(255, 255, 255, 0.85)` - Main cards and forms
- **Medium Glass**: `rgba(255, 255, 255, 0.70)` - Input fields and secondary surfaces
- **Dark Glass**: `rgba(255, 255, 255, 0.60)` - Overlays and modals

#### Gradients
- **Primary Gradient**: `linear-gradient(135deg, #F0F8F4 0%, #E6F3F0 25%, #D4E9E2 100%)`
- **Warm Gradient**: `linear-gradient(135deg, #FFF8F0 0%, #F4F1E8 50%, #E8F0E6 100%)`

#### Usage Guidelines
- Use primary colors for main actions, navigation, and key UI elements
- Secondary colors for accents, badges, and secondary actions  
- Accent colors sparingly for warnings, success states, and CTAs
- Glass effects for all cards, modals, forms, and overlay surfaces
- Gradients for body backgrounds and large surface areas

### Typography System

#### Font Family
```css
fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
```

#### Hierarchy & Sizing
- **H1**: 2.5rem, weight 700, line-height 1.2 - Page titles
- **H2**: 2rem, weight 600, line-height 1.3 - Section headers  
- **H3**: 1.75rem, weight 600, line-height 1.3 - Card titles
- **H4**: 1.5rem, weight 600, line-height 1.4 - Subsections
- **H5**: 1.25rem, weight 500, line-height 1.4 - Component titles
- **H6**: 1.125rem, weight 500, line-height 1.4 - Small headings
- **Body1**: 1rem, line-height 1.6 - Main content
- **Body2**: 0.875rem, line-height 1.6 - Secondary content
- **Button**: weight 600, textTransform 'none' - All buttons

#### Typography Guidelines
- Use gradient text effects for hero titles: `background: linear-gradient(135deg, #2E7D6B 0%, #4A9B8A 100%)`
- Line height 1.6 for all body text to improve readability
- Weight 600+ for all interactive elements (buttons, links)
- Never use all-caps transformation

### Responsive Breakpoints

```css
breakpoints: {
  xs: 0,      // Mobile portrait
  sm: 640,    // Mobile landscape
  md: 768,    // Tablet
  lg: 1024,   // Desktop
  xl: 1280,   // Large desktop
}
```

#### Responsive Patterns
- **Mobile-first approach**: Design for xs first, then enhance
- **Grid System**: Use Material-UI Grid with responsive spacing
- **Typography scaling**: Reduce font sizes by 10-20% on mobile
- **Touch targets**: Minimum 48px height for interactive elements
- **Spacing**: Use responsive spacing objects `{ xs: 2, sm: 3, md: 4 }`

### Component Design Patterns

#### Cards & Surfaces
```css
borderRadius: 20px
boxShadow: '0 12px 40px rgba(46, 125, 107, 0.08), 0 4px 16px rgba(46, 125, 107, 0.04)'
background: 'rgba(255, 255, 255, 0.85)'
border: '1px solid rgba(255, 255, 255, 0.25)'
backdropFilter: 'blur(20px)'
```

#### Hover Effects
```css
transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
'&:hover': {
  transform: 'translateY(-2px)',
  boxShadow: '0 16px 48px rgba(46, 125, 107, 0.12), 0 8px 24px rgba(46, 125, 107, 0.06)'
}
```

#### Buttons
- **Primary**: Gradient background from primary to primaryDark
- **Secondary**: Outlined with 2px border
- **Border radius**: 12px for buttons
- **Padding**: 10px 24px (adjust for size variants)
- **Hover**: Subtle lift with `translateY(-1px)` and enhanced shadow

#### Form Fields
- **Border radius**: 12px
- **Background**: Medium glass with backdrop blur
- **Focus state**: Light glass background + subtle primary shadow
- **Hover**: Transition to light glass background

#### Navigation
- **Desktop Sidebar**: Light glass with 24px border radius on right side
- **Mobile Bottom Nav**: Light glass with top border radius 24px, height 70px
- **Selected states**: Gradient background with left border accent

### Spacing System

#### Base Unit: 8px
- **xs**: 8px (1 unit)
- **sm**: 16px (2 units)  
- **md**: 24px (3 units)
- **lg**: 32px (4 units)
- **xl**: 40px (5 units)

#### Responsive Spacing Examples
```jsx
// Component padding
p: { xs: 2, sm: 3, md: 4 }  // 16px, 24px, 32px

// Margin bottom
mb: { xs: 3, sm: 4, md: 6 }  // 24px, 32px, 48px

// Gap in flex/grid
gap: { xs: 2, sm: 2.5 }  // 16px, 20px
```

### Accessibility Guidelines

#### Color Contrast
- Ensure minimum 4.5:1 contrast ratio for text
- Use semantic colors (success, warning, error) appropriately
- Test with color blindness simulators

#### Interactive Elements
- Minimum 48px touch targets on mobile
- Clear focus indicators with 3px shadows
- Proper ARIA labels and roles
- Keyboard navigation support

#### Typography
- Minimum 16px font size on mobile (14px acceptable for captions)
- Adequate line spacing (1.6 for body text)
- High contrast text colors: `#2C3E50` primary, `#5D6D7E` secondary

### Animation & Micro-interactions

#### Timing Functions
- **Standard**: `cubic-bezier(0.4, 0, 0.2, 1)` - Most interactions
- **Fast**: `0.2s` - Hover effects, focus states
- **Medium**: `0.3s` - Card animations, transforms
- **Slow**: `0.4s` - Page transitions, modals

#### Transform Patterns
- **Hover lift**: `translateY(-2px)` for cards
- **Button press**: `translateY(-1px)` for buttons  
- **Scale emphasis**: `scale(1.05)` for FABs
- **Slide navigation**: `translateX(4px)` for list items

### Layout Patterns

#### Page Structure
```jsx
<Box sx={{ 
  minHeight: '100vh',
  px: { xs: 2, sm: 3, md: 4 },
  py: { xs: 3, sm: 4 },
  maxWidth: { md: 1200 },
  mx: 'auto'
}}>
```

#### Card Layouts
```jsx
<Card>
  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
    {/* Content with responsive padding */}
  </CardContent>
</Card>
```

#### Grid Layouts
```jsx
<Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
  <Grid item xs={12} md={6}>
    {/* Responsive columns */}
  </Grid>
</Grid>
```

### Wellness-Specific UI Elements

#### Empty States
- Use encouraging, wellness-focused messaging
- Include nature emojis (🌿, 🌱, ✨)
- Suggest positive actions or self-care

#### Loading States
- Professional loading screens with context
- Example: "Loading your wellness dashboard..."
- Use thicker CircularProgress (thickness={4})

#### Success/Growth Indicators
- Use growth metaphors ("Your progress is blooming")
- Green colors for positive outcomes
- Celebration emojis (🎉, ⭐, 🌟)

#### Therapeutic Language
- Avoid medical jargon, use warm, accessible language
- "Clients" instead of "Patients"
- "Sessions" instead of "Appointments" when appropriate
- "Wellness journey" instead of "treatment"

### Implementation Checklist

For every new component/page:
- [ ] Use the established color palette
- [ ] Implement glassmorphism effects (blur, transparency, borders)
- [ ] Add responsive spacing and typography
- [ ] Include smooth hover/focus animations
- [ ] Test on mobile, tablet, and desktop
- [ ] Verify accessibility (contrast, touch targets, keyboard nav)
- [ ] Use wellness-focused language and messaging
- [ ] Add appropriate micro-interactions
- [ ] Follow the established component patterns

## Development Troubleshooting

### Common Issues & Solutions

#### Service Startup Issues
- **Error**: "Cannot connect to database" → Ensure PostgreSQL container is running: `docker compose up postgres`
- **Error**: "NATS connection failed" → Start NATS broker: `docker compose up nats`
- **Error**: "@clinic/common not found" → Build shared library first: `yarn workspace @clinic/common build`
- **Error**: "Port already in use" → Check if services are already running or change ports in docker-compose.yml

#### Frontend Development Issues
- **Error**: "API calls failing" → Ensure API Gateway is running on port 4000
- **Error**: "Proxy errors" → Check vite.config.ts proxy configuration matches running services
- **Error**: "Theme not loading" → Verify theme.ts exports and Material-UI setup

#### Testing Issues
- **Error**: "Tests failing in CI" → Environment variables may be missing (see scripts/test.sh)
- **Error**: "Coverage below threshold" → Add tests to reach 80% coverage requirement
- **Error**: "Database connection in tests" → Tests use mock database, check jest.config.js

#### Database Issues
- **Error**: "Migration failed" → Check entity syntax and database connection
- **Error**: "Entity not found" → Ensure TypeORM entity registration in module
- **Error**: "Foreign key constraint" → Check entity relationships and cascade options

### Performance Considerations
- **Frontend**: Use React.memo() for expensive components, lazy load routes
- **Backend**: Implement pagination for large datasets, use proper database indexing
- **Database**: Connection pooling is configured, monitor connection usage
- **NATS**: Messages are fire-and-forget by default, use request-reply for critical operations