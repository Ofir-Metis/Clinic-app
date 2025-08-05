#!/usr/bin/env node

/**
 * Audit Retention Cleanup Script
 * Automated cleanup of old audit events based on retention policies
 * Designed to run as a scheduled job (cron) for HIPAA compliance
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration
const RETENTION_POLICIES = {
  // HIPAA requires 6 years minimum for most healthcare data
  // 7 years is common practice for legal safety
  DEFAULT_RETENTION_DAYS: 2555, // 7 years
  
  // Critical security events - keep longer
  SECURITY_RETENTION_DAYS: 3650, // 10 years
  
  // Patient data access - HIPAA minimum
  PATIENT_ACCESS_RETENTION_DAYS: 2190, // 6 years
  
  // Administrative actions - longer retention
  ADMIN_RETENTION_DAYS: 2920, // 8 years
  
  // System events - shorter retention
  SYSTEM_RETENTION_DAYS: 1825, // 5 years
};

// Database configuration
const DB_CONFIG = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
  database: process.env.POSTGRES_DB || 'clinic',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
};

class AuditRetentionCleanup {
  constructor() {
    this.client = new Client(DB_CONFIG);
    this.logFile = path.join(__dirname, '..', 'logs', 'audit-cleanup.log');
    this.dryRun = process.argv.includes('--dry-run');
    this.verbose = process.argv.includes('--verbose');
  }

  async run() {
    try {
      this.log('Starting audit retention cleanup...');
      
      await this.client.connect();
      this.log('Connected to database');

      const results = await this.cleanupByCategory();
      
      await this.generateCleanupReport(results);
      
      this.log('Audit retention cleanup completed successfully');
      
    } catch (error) {
      this.logError('Audit retention cleanup failed', error);
      process.exit(1);
    } finally {
      await this.client.end();
    }
  }

  async cleanupByCategory() {
    const results = {};

    // Clean up by category with different retention periods
    const categories = [
      { name: 'SECURITY', days: RETENTION_POLICIES.SECURITY_RETENTION_DAYS },
      { name: 'DATA_ACCESS', days: RETENTION_POLICIES.PATIENT_ACCESS_RETENTION_DAYS },
      { name: 'CLINICAL', days: RETENTION_POLICIES.PATIENT_ACCESS_RETENTION_DAYS },
      { name: 'ADMINISTRATIVE', days: RETENTION_POLICIES.ADMIN_RETENTION_DAYS },
      { name: 'SYSTEM', days: RETENTION_POLICIES.SYSTEM_RETENTION_DAYS },
      { name: 'DEFAULT', days: RETENTION_POLICIES.DEFAULT_RETENTION_DAYS },
    ];

    for (const category of categories) {
      this.log(`Processing category: ${category.name} (${category.days} days retention)`);
      
      const deletedCount = await this.cleanupCategory(category.name, category.days);
      results[category.name] = deletedCount;
      
      this.log(`${category.name}: ${deletedCount} records processed`);
    }

    return results;
  }

  async cleanupCategory(category, retentionDays) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let query, params;

    if (category === 'DEFAULT') {
      // Clean up records not covered by specific categories
      query = `
        SELECT COUNT(*) as count
        FROM audit_events 
        WHERE timestamp < $1 
        AND category NOT IN ('SECURITY', 'DATA_ACCESS', 'CLINICAL', 'ADMINISTRATIVE', 'SYSTEM')
      `;
      params = [cutoffDate];
    } else {
      query = `
        SELECT COUNT(*) as count
        FROM audit_events 
        WHERE timestamp < $1 AND category = $2
      `;
      params = [cutoffDate, category];
    }

    // First, count the records to be deleted
    const countResult = await this.client.query(query, params);
    const recordCount = parseInt(countResult.rows[0].count);

    if (recordCount === 0) {
      this.log(`No records to clean up for category: ${category}`);
      return 0;
    }

    this.log(`Found ${recordCount} records to clean up for category: ${category}`);

    if (this.dryRun) {
      this.log(`DRY RUN: Would delete ${recordCount} records from category: ${category}`);
      return recordCount;
    }

    // Archive critical records before deletion
    if (category === 'SECURITY' || category === 'DATA_ACCESS') {
      await this.archiveRecords(category, cutoffDate);
    }

    // Delete the records
    let deleteQuery;
    if (category === 'DEFAULT') {
      deleteQuery = `
        DELETE FROM audit_events 
        WHERE timestamp < $1 
        AND category NOT IN ('SECURITY', 'DATA_ACCESS', 'CLINICAL', 'ADMINISTRATIVE', 'SYSTEM')
      `;
    } else {
      deleteQuery = `
        DELETE FROM audit_events 
        WHERE timestamp < $1 AND category = $2
      `;
    }

    const deleteResult = await this.client.query(deleteQuery, params);
    const deletedCount = deleteResult.rowCount;

    this.log(`Successfully deleted ${deletedCount} records from category: ${category}`);
    
    // Log the cleanup action in audit trail
    await this.logCleanupAction(category, deletedCount, cutoffDate);

    return deletedCount;
  }

  async archiveRecords(category, cutoffDate) {
    this.log(`Archiving ${category} records before deletion...`);
    
    const archiveDir = path.join(__dirname, '..', 'archives', 'audit-events');
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    const archiveFile = path.join(
      archiveDir, 
      `${category.toLowerCase()}-${cutoffDate.toISOString().split('T')[0]}.json`
    );

    const query = `
      SELECT * FROM audit_events 
      WHERE timestamp < $1 AND category = $2
      ORDER BY timestamp DESC
    `;

    const result = await this.client.query(query, [cutoffDate, category]);
    
    if (result.rows.length > 0) {
      fs.writeFileSync(archiveFile, JSON.stringify(result.rows, null, 2));
      this.log(`Archived ${result.rows.length} ${category} records to ${archiveFile}`);
    }
  }

  async logCleanupAction(category, deletedCount, cutoffDate) {
    const insertQuery = `
      INSERT INTO audit_events (
        id, event_type, category, severity, description,
        timestamp, source_system, additional_data,
        include_in_compliance_report
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
    `;

    const auditId = `AUD_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
    
    const values = [
      auditId,
      'DATA_RETENTION_POLICY_APPLIED',
      'COMPLIANCE',
      'MEDIUM',
      `Automated cleanup: ${deletedCount} ${category} records deleted (retention cutoff: ${cutoffDate.toISOString()})`,
      new Date(),
      'audit-retention-cleanup',
      JSON.stringify({
        category,
        deletedCount,
        cutoffDate: cutoffDate.toISOString(),
        retentionPolicy: 'automated_cleanup',
        scriptVersion: '1.0.0',
      }),
      true,
    ];

    await this.client.query(insertQuery, values);
  }

  async generateCleanupReport(results) {
    const reportDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportFile = path.join(
      reportDir,
      `audit-cleanup-report-${new Date().toISOString().split('T')[0]}.json`
    );

    const totalDeleted = Object.values(results).reduce((sum, count) => sum + count, 0);
    
    const report = {
      timestamp: new Date().toISOString(),
      dryRun: this.dryRun,
      totalRecordsProcessed: totalDeleted,
      resultsByCategory: results,
      retentionPolicies: RETENTION_POLICIES,
      databaseConfig: {
        host: DB_CONFIG.host,
        database: DB_CONFIG.database,
      },
    };

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    this.log(`Cleanup report saved to: ${reportFile}`);

    // Generate summary
    this.log('=== CLEANUP SUMMARY ===');
    this.log(`Total records processed: ${totalDeleted}`);
    for (const [category, count] of Object.entries(results)) {
      this.log(`${category}: ${count} records`);
    }
    this.log(`Report saved to: ${reportFile}`);
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    console.log(logMessage);
    
    // Append to log file
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  logError(message, error) {
    const timestamp = new Date().toISOString();
    const errorMessage = `[${timestamp}] ERROR: ${message}\n${error.stack || error}`;
    
    console.error(errorMessage);
    
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.appendFileSync(this.logFile, errorMessage + '\n');
  }
}

// Handle command line arguments
function showUsage() {
  console.log(`
Usage: node audit-retention-cleanup.js [options]

Options:
  --dry-run     Run in dry-run mode (don't actually delete records)
  --verbose     Enable verbose logging
  --help        Show this help message

Environment Variables:
  POSTGRES_HOST     Database host (default: localhost)
  POSTGRES_PORT     Database port (default: 5432)
  POSTGRES_DB       Database name (default: clinic)
  POSTGRES_USER     Database user (default: postgres)
  POSTGRES_PASSWORD Database password (default: password)

Examples:
  node audit-retention-cleanup.js --dry-run
  node audit-retention-cleanup.js --verbose
  POSTGRES_HOST=prod-db node audit-retention-cleanup.js
  `);
}

// Main execution
if (process.argv.includes('--help')) {
  showUsage();
  process.exit(0);
}

const cleanup = new AuditRetentionCleanup();
cleanup.run().catch(error => {
  console.error('Cleanup failed:', error);
  process.exit(1);
});