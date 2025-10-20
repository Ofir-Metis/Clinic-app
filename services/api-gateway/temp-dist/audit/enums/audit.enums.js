"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceType = exports.ComplianceFramework = exports.RiskLevel = exports.AuditSeverity = exports.AuditCategory = exports.AuditEventType = void 0;
/**
 * Comprehensive audit event types for healthcare platform
 * Covers HIPAA compliance, security, and operational requirements
 */
var AuditEventType;
(function (AuditEventType) {
    // Authentication Events
    AuditEventType["LOGIN_SUCCESS"] = "LOGIN_SUCCESS";
    AuditEventType["LOGIN_FAILED"] = "LOGIN_FAILED";
    AuditEventType["LOGOUT"] = "LOGOUT";
    AuditEventType["PASSWORD_CHANGED"] = "PASSWORD_CHANGED";
    AuditEventType["PASSWORD_RESET_REQUESTED"] = "PASSWORD_RESET_REQUESTED";
    AuditEventType["PASSWORD_RESET_COMPLETED"] = "PASSWORD_RESET_COMPLETED";
    AuditEventType["MFA_ENABLED"] = "MFA_ENABLED";
    AuditEventType["MFA_DISABLED"] = "MFA_DISABLED";
    AuditEventType["MFA_VERIFIED"] = "MFA_VERIFIED";
    AuditEventType["MFA_FAILED"] = "MFA_FAILED";
    AuditEventType["ACCOUNT_LOCKED"] = "ACCOUNT_LOCKED";
    AuditEventType["ACCOUNT_UNLOCKED"] = "ACCOUNT_UNLOCKED";
    // Data Access Events (HIPAA Critical)
    AuditEventType["PATIENT_DATA_VIEWED"] = "PATIENT_DATA_VIEWED";
    AuditEventType["PATIENT_DATA_CREATED"] = "PATIENT_DATA_CREATED";
    AuditEventType["PATIENT_DATA_UPDATED"] = "PATIENT_DATA_UPDATED";
    AuditEventType["PATIENT_DATA_DELETED"] = "PATIENT_DATA_DELETED";
    AuditEventType["PATIENT_DATA_EXPORTED"] = "PATIENT_DATA_EXPORTED";
    AuditEventType["PATIENT_SEARCH_PERFORMED"] = "PATIENT_SEARCH_PERFORMED";
    AuditEventType["MEDICAL_RECORD_ACCESSED"] = "MEDICAL_RECORD_ACCESSED";
    AuditEventType["MEDICAL_RECORD_MODIFIED"] = "MEDICAL_RECORD_MODIFIED";
    AuditEventType["CLINICAL_NOTES_VIEWED"] = "CLINICAL_NOTES_VIEWED";
    AuditEventType["CLINICAL_NOTES_CREATED"] = "CLINICAL_NOTES_CREATED";
    AuditEventType["CLINICAL_NOTES_UPDATED"] = "CLINICAL_NOTES_UPDATED";
    AuditEventType["LAB_RESULTS_ACCESSED"] = "LAB_RESULTS_ACCESSED";
    AuditEventType["PRESCRIPTION_ACCESSED"] = "PRESCRIPTION_ACCESSED";
    AuditEventType["IMAGING_ACCESSED"] = "IMAGING_ACCESSED";
    // Administrative Events
    AuditEventType["USER_CREATED"] = "USER_CREATED";
    AuditEventType["USER_UPDATED"] = "USER_UPDATED";
    AuditEventType["USER_DELETED"] = "USER_DELETED";
    AuditEventType["USER_SUSPENDED"] = "USER_SUSPENDED";
    AuditEventType["USER_REACTIVATED"] = "USER_REACTIVATED";
    AuditEventType["ROLE_CHANGED"] = "ROLE_CHANGED";
    AuditEventType["PERMISSION_GRANTED"] = "PERMISSION_GRANTED";
    AuditEventType["PERMISSION_REVOKED"] = "PERMISSION_REVOKED";
    AuditEventType["ADMIN_IMPERSONATION_STARTED"] = "ADMIN_IMPERSONATION_STARTED";
    AuditEventType["ADMIN_IMPERSONATION_ENDED"] = "ADMIN_IMPERSONATION_ENDED";
    AuditEventType["SYSTEM_CONFIGURATION_CHANGED"] = "SYSTEM_CONFIGURATION_CHANGED";
    AuditEventType["BACKUP_CREATED"] = "BACKUP_CREATED";
    AuditEventType["BACKUP_RESTORED"] = "BACKUP_RESTORED";
    // Security Events
    AuditEventType["UNAUTHORIZED_ACCESS"] = "UNAUTHORIZED_ACCESS";
    AuditEventType["SUSPICIOUS_ACTIVITY"] = "SUSPICIOUS_ACTIVITY";
    AuditEventType["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    AuditEventType["INVALID_TOKEN"] = "INVALID_TOKEN";
    AuditEventType["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    AuditEventType["CSRF_DETECTED"] = "CSRF_DETECTED";
    AuditEventType["SQL_INJECTION_ATTEMPT"] = "SQL_INJECTION_ATTEMPT";
    AuditEventType["XSS_ATTEMPT"] = "XSS_ATTEMPT";
    AuditEventType["BRUTE_FORCE_ATTEMPT"] = "BRUTE_FORCE_ATTEMPT";
    AuditEventType["PRIVILEGE_ESCALATION_ATTEMPT"] = "PRIVILEGE_ESCALATION_ATTEMPT";
    AuditEventType["DATA_BREACH_DETECTED"] = "DATA_BREACH_DETECTED";
    AuditEventType["SECURITY_POLICY_VIOLATION"] = "SECURITY_POLICY_VIOLATION";
    // File and Document Events
    AuditEventType["FILE_UPLOADED"] = "FILE_UPLOADED";
    AuditEventType["FILE_DOWNLOADED"] = "FILE_DOWNLOADED";
    AuditEventType["FILE_DELETED"] = "FILE_DELETED";
    AuditEventType["FILE_SHARED"] = "FILE_SHARED";
    AuditEventType["DOCUMENT_PRINTED"] = "DOCUMENT_PRINTED";
    AuditEventType["DOCUMENT_EMAILED"] = "DOCUMENT_EMAILED";
    AuditEventType["DOCUMENT_FAXED"] = "DOCUMENT_FAXED";
    // Communication Events
    AuditEventType["MESSAGE_SENT"] = "MESSAGE_SENT";
    AuditEventType["MESSAGE_RECEIVED"] = "MESSAGE_RECEIVED";
    AuditEventType["EMAIL_SENT"] = "EMAIL_SENT";
    AuditEventType["SMS_SENT"] = "SMS_SENT";
    AuditEventType["APPOINTMENT_REMINDER_SENT"] = "APPOINTMENT_REMINDER_SENT";
    AuditEventType["COMMUNICATION_CONSENT_UPDATED"] = "COMMUNICATION_CONSENT_UPDATED";
    // Appointment and Scheduling Events
    AuditEventType["APPOINTMENT_CREATED"] = "APPOINTMENT_CREATED";
    AuditEventType["APPOINTMENT_UPDATED"] = "APPOINTMENT_UPDATED";
    AuditEventType["APPOINTMENT_CANCELLED"] = "APPOINTMENT_CANCELLED";
    AuditEventType["APPOINTMENT_CHECKED_IN"] = "APPOINTMENT_CHECKED_IN";
    AuditEventType["APPOINTMENT_NO_SHOW"] = "APPOINTMENT_NO_SHOW";
    AuditEventType["SCHEDULE_ACCESSED"] = "SCHEDULE_ACCESSED";
    // Billing and Financial Events
    AuditEventType["INVOICE_CREATED"] = "INVOICE_CREATED";
    AuditEventType["PAYMENT_PROCESSED"] = "PAYMENT_PROCESSED";
    AuditEventType["PAYMENT_FAILED"] = "PAYMENT_FAILED";
    AuditEventType["REFUND_PROCESSED"] = "REFUND_PROCESSED";
    AuditEventType["BILLING_INFORMATION_UPDATED"] = "BILLING_INFORMATION_UPDATED";
    AuditEventType["INSURANCE_CLAIM_SUBMITTED"] = "INSURANCE_CLAIM_SUBMITTED";
    // System Events
    AuditEventType["SYSTEM_STARTUP"] = "SYSTEM_STARTUP";
    AuditEventType["SYSTEM_SHUTDOWN"] = "SYSTEM_SHUTDOWN";
    AuditEventType["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    AuditEventType["DATABASE_CONNECTION_FAILED"] = "DATABASE_CONNECTION_FAILED";
    AuditEventType["API_RATE_LIMIT_CONFIGURED"] = "API_RATE_LIMIT_CONFIGURED";
    AuditEventType["MAINTENANCE_MODE_ENABLED"] = "MAINTENANCE_MODE_ENABLED";
    AuditEventType["MAINTENANCE_MODE_DISABLED"] = "MAINTENANCE_MODE_DISABLED";
    // Compliance and Audit Events
    AuditEventType["AUDIT_LOG_ACCESSED"] = "AUDIT_LOG_ACCESSED";
    AuditEventType["AUDIT_LOG_EXPORTED"] = "AUDIT_LOG_EXPORTED";
    AuditEventType["COMPLIANCE_REPORT_GENERATED"] = "COMPLIANCE_REPORT_GENERATED";
    AuditEventType["DATA_RETENTION_POLICY_APPLIED"] = "DATA_RETENTION_POLICY_APPLIED";
    AuditEventType["GDPR_REQUEST_RECEIVED"] = "GDPR_REQUEST_RECEIVED";
    AuditEventType["HIPAA_VIOLATION_DETECTED"] = "HIPAA_VIOLATION_DETECTED";
    AuditEventType["BREACH_NOTIFICATION_SENT"] = "BREACH_NOTIFICATION_SENT";
    // Integration Events
    AuditEventType["EXTERNAL_API_CALLED"] = "EXTERNAL_API_CALLED";
    AuditEventType["EXTERNAL_API_FAILED"] = "EXTERNAL_API_FAILED";
    AuditEventType["WEBHOOK_RECEIVED"] = "WEBHOOK_RECEIVED";
    AuditEventType["DATA_SYNC_STARTED"] = "DATA_SYNC_STARTED";
    AuditEventType["DATA_SYNC_COMPLETED"] = "DATA_SYNC_COMPLETED";
    AuditEventType["DATA_SYNC_FAILED"] = "DATA_SYNC_FAILED";
    // AI and Analytics Events
    AuditEventType["AI_MODEL_ACCESSED"] = "AI_MODEL_ACCESSED";
    AuditEventType["AI_PREDICTION_MADE"] = "AI_PREDICTION_MADE";
    AuditEventType["ANALYTICS_REPORT_VIEWED"] = "ANALYTICS_REPORT_VIEWED";
    AuditEventType["DATA_ANALYSIS_PERFORMED"] = "DATA_ANALYSIS_PERFORMED";
})(AuditEventType || (exports.AuditEventType = AuditEventType = {}));
/**
 * Categories for grouping related audit events
 */
var AuditCategory;
(function (AuditCategory) {
    AuditCategory["AUTHENTICATION"] = "AUTHENTICATION";
    AuditCategory["DATA_ACCESS"] = "DATA_ACCESS";
    AuditCategory["ADMINISTRATIVE"] = "ADMINISTRATIVE";
    AuditCategory["SECURITY"] = "SECURITY";
    AuditCategory["SYSTEM"] = "SYSTEM";
    AuditCategory["COMMUNICATION"] = "COMMUNICATION";
    AuditCategory["FINANCIAL"] = "FINANCIAL";
    AuditCategory["COMPLIANCE"] = "COMPLIANCE";
    AuditCategory["INTEGRATION"] = "INTEGRATION";
    AuditCategory["CLINICAL"] = "CLINICAL";
    AuditCategory["FILE_MANAGEMENT"] = "FILE_MANAGEMENT";
    AuditCategory["AI_ANALYTICS"] = "AI_ANALYTICS";
})(AuditCategory || (exports.AuditCategory = AuditCategory = {}));
/**
 * Severity levels for audit events
 */
var AuditSeverity;
(function (AuditSeverity) {
    AuditSeverity["LOW"] = "LOW";
    AuditSeverity["MEDIUM"] = "MEDIUM";
    AuditSeverity["HIGH"] = "HIGH";
    AuditSeverity["CRITICAL"] = "CRITICAL";
})(AuditSeverity || (exports.AuditSeverity = AuditSeverity = {}));
/**
 * Risk levels for security assessment
 */
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["MINIMAL"] = "MINIMAL";
    RiskLevel["LOW"] = "LOW";
    RiskLevel["MODERATE"] = "MODERATE";
    RiskLevel["HIGH"] = "HIGH";
    RiskLevel["SEVERE"] = "SEVERE";
    RiskLevel["CRITICAL"] = "CRITICAL";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
/**
 * Compliance frameworks
 */
var ComplianceFramework;
(function (ComplianceFramework) {
    ComplianceFramework["HIPAA"] = "HIPAA";
    ComplianceFramework["GDPR"] = "GDPR";
    ComplianceFramework["SOX"] = "SOX";
    ComplianceFramework["PCI_DSS"] = "PCI_DSS";
    ComplianceFramework["HITECH"] = "HITECH";
    ComplianceFramework["FERPA"] = "FERPA";
    ComplianceFramework["SOC2"] = "SOC2";
})(ComplianceFramework || (exports.ComplianceFramework = ComplianceFramework = {}));
/**
 * Device types for client identification
 */
var DeviceType;
(function (DeviceType) {
    DeviceType["DESKTOP"] = "DESKTOP";
    DeviceType["MOBILE"] = "MOBILE";
    DeviceType["TABLET"] = "TABLET";
    DeviceType["KIOSK"] = "KIOSK";
    DeviceType["API_CLIENT"] = "API_CLIENT";
    DeviceType["UNKNOWN"] = "UNKNOWN";
})(DeviceType || (exports.DeviceType = DeviceType = {}));
