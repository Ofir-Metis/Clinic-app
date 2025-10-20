/**
 * User Role Enum - Enterprise-grade role definitions
 * Defines all user roles in the healthcare platform with clear hierarchy
 */

export enum UserRole {
  CLIENT = 'client',
  COACH = 'coach', 
  THERAPIST = 'therapist', // Alias for coach in some contexts
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  COMPLIANCE_OFFICER = 'compliance_officer',
  SECURITY_OFFICER = 'security_officer',
  PRIVACY_OFFICER = 'privacy_officer',
  HEALTHCARE_PROVIDER = 'healthcare_provider',
  NURSE = 'nurse',
  CONSENT_MANAGER = 'consent_manager',
  MANAGER = 'manager',
  DISASTER_RECOVERY_MANAGER = 'disaster_recovery_manager',
  BACKUP_OPERATOR = 'backup_operator',
  BUSINESS_CONTINUITY_MANAGER = 'business_continuity_manager',
  INCIDENT_COMMANDER = 'incident_commander',
  TEST_COORDINATOR = 'test_coordinator',
  SYSTEM_ADMINISTRATOR = 'system_administrator'
}

/**
 * Role hierarchy mapping for permission checks
 * Higher numbers indicate higher privileges
 */
export const ROLE_HIERARCHY = {
  [UserRole.CLIENT]: 1,
  [UserRole.COACH]: 2,
  [UserRole.THERAPIST]: 2, // Same as coach
  [UserRole.NURSE]: 2,
  [UserRole.HEALTHCARE_PROVIDER]: 2,
  [UserRole.CONSENT_MANAGER]: 3,
  [UserRole.PRIVACY_OFFICER]: 3,
  [UserRole.COMPLIANCE_OFFICER]: 3,
  [UserRole.SECURITY_OFFICER]: 3,
  [UserRole.DISASTER_RECOVERY_MANAGER]: 3,
  [UserRole.BACKUP_OPERATOR]: 3,
  [UserRole.BUSINESS_CONTINUITY_MANAGER]: 3,
  [UserRole.INCIDENT_COMMANDER]: 3,
  [UserRole.TEST_COORDINATOR]: 3,
  [UserRole.MANAGER]: 4,
  [UserRole.ADMIN]: 4,
  [UserRole.SYSTEM_ADMINISTRATOR]: 5,
  [UserRole.SUPER_ADMIN]: 5,
} as const;

/**
 * Check if a user role has sufficient privileges
 * @param userRole - The user's role
 * @param requiredRole - The minimum required role
 * @returns true if user has sufficient privileges
 */
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get all roles that have equal or higher privileges than the specified role
 * @param role - The base role
 * @returns Array of roles with equal or higher privileges
 */
export function getRolesWithMinimumPrivilege(role: UserRole): UserRole[] {
  const baseLevel = ROLE_HIERARCHY[role];
  return Object.entries(ROLE_HIERARCHY)
    .filter(([, level]) => level >= baseLevel)
    .map(([roleName]) => roleName as UserRole);
}