---
globs:
  - "frontend/src/**/*.tsx"
  - "frontend/src/**/*.ts"
---

# React Frontend Rules

## Translation System (MANDATORY)
ALL user-visible text must use the translation system. No hardcoded strings.

```typescript
import { useTranslation } from '../contexts/LanguageContext';
const { t, translations } = useTranslation();

// Preferred: direct object access (autocomplete works)
<h1>{translations.dashboard.title}</h1>

// Alternative: dot notation
<h1>{t('dashboard.title')}</h1>
```

Translation files: `frontend/src/i18n/translations/` (en.ts, he.ts, es.ts)

## Design System
- Material Design 3, primary color `#2E7D6B`
- Use MUI components (`@mui/material`)
- Mobile-first responsive design
- RTL support handled automatically by LanguageContext

## Routing
- Coach routes: `/` (default layout via MainLayout)
- Client routes: `/client/*` (WellnessLayout)
- Admin routes: `/admin/*`
- Auth routes: `/login`, `/register`, `/reset-password`

## React Patterns
- Functional components with hooks only
- Use `useRef` for values read inside `setInterval`/`requestAnimationFrame` callbacks (stale closure prevention)
- Always `URL.revokeObjectURL()` before creating new object URLs or setting to null
- Use existing layouts: `MainLayout`, `WellnessLayout`

## API Layer
- API functions in `frontend/src/api/` directory
- Base URL from `frontend/src/env.ts`
- Auth context in `frontend/src/contexts/AuthContext.tsx`

## Terminology (User-Facing)
- "Clients" not "Patients"
- "Coach" not "Therapist"
- "Coaching Sessions" not "Appointments"
- "Growth Journey" not "Treatment"
