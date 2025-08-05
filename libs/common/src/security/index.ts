/**
 * Security Module Exports
 * 
 * Provides comprehensive security scanning, vulnerability management,
 * and continuous monitoring capabilities for healthcare environments.
 */

export { VulnerabilityScanner } from './vulnerability-scanner.service';
export { SecurityMonitoringService } from './security-monitoring.service';
export { SecurityModule } from './security.module';

// Type exports
export type {
  VulnerabilityReport,
  Vulnerability,
  SecurityRecommendation,
  ScanConfiguration
} from './vulnerability-scanner.service';

export type {
  SecurityAlert,
  SecurityMetrics,
  ThreatIntelligence
} from './security-monitoring.service';