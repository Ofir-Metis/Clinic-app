/**
 * Database Common Module Exports
 * 
 * Provides database optimization and management utilities
 * for the clinic management platform.
 */

export { DatabaseOptimizationService } from './database-optimization.service';
export { DatabaseOptimizationModule } from './database-optimization.module';

// Type exports for database optimization
export interface OptimizationReport {
  analysisDate: Date;
  databaseSize: string;
  totalTables: number;
  totalIndexes: number;
  recommendations: {
    createIndexes: Array<{
      table: string;
      columns: string[];
      type: 'btree' | 'hash' | 'gin' | 'gist';
      reason: string;
      estimatedImprovement: string;
    }>;
    dropIndexes: Array<{
      table: string;
      indexName: string;
      reason: string;
      estimatedSavings: string;
    }>;
    optimizeQueries: Array<{
      query: string;
      currentTime: number;
      recommendation: string;
      estimatedImprovement: string;
    }>;
    maintenanceTasks: Array<{
      task: 'vacuum' | 'analyze' | 'reindex' | 'cluster';
      tables: string[];
      priority: 'high' | 'medium' | 'low';
      reason: string;
    }>;
  };
  healthScore: number;
}

export interface DatabaseHealthSummary {
  healthScore: number;
  databaseSize: string;
  connectionUsage: number;
  lastOptimizationDate: string;
  status: 'healthy' | 'warning' | 'critical';
}