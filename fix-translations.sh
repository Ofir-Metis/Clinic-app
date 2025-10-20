#!/bin/bash

# Fix all react-i18next imports to use local LanguageContext
echo "🔧 Fixing translation imports across all pages..."

# List of files to fix
FILES=(
  "frontend/src/pages/RegistrationPage.tsx"
  "frontend/src/pages/LoginPage.tsx"
  "frontend/src/pages/AddPatientPage.tsx"
  "frontend/src/pages/PatientLoginPage.tsx"
  "frontend/src/pages/ResetConfirmPage.tsx"
  "frontend/src/pages/ResetRequestPage.tsx"
  "frontend/src/pages/AuthPage.tsx"
  "frontend/src/pages/AddAppointmentPage.tsx"
  "frontend/src/pages/TreatmentHistoryPage.tsx"
  "frontend/src/pages/PatientHistoryPage.tsx"
  "frontend/src/pages/ToolsPage.tsx"
  "frontend/src/pages/CalendarPage.tsx"
  "frontend/src/pages/TherapistProfilePage.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ Fixing $file"
    # Replace react-i18next import with local LanguageContext
    sed -i "s|import { useTranslation } from 'react-i18next';|import { useTranslation } from '../contexts/LanguageContext';|g" "$file"
  else
    echo "⚠️  File not found: $file"
  fi
done

echo "🎉 Translation import fixes complete!"
echo "📋 Next: Update hardcoded strings to use translation keys"