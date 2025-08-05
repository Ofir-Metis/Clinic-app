import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner, Index } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { CentralizedLoggerService } from '../logging/centralized-logger.service';

interface IndexAnalysis {
  tableName: string;
  indexName: string;
  indexType: string;
  columns: string[];
  isUnique: boolean;
  isPartial: boolean;
  size: string;
  usage: {
    scans: number;
    tupleReads: number;
    tupleFetches: number;
  };
  recommendation: 'keep' | 'drop' | 'optimize' | 'create';
  reason: string;
}

interface QueryPerformanceMetrics {
  query: string;
  totalTime: number;
  meanTime: number;
  calls: number;
  rows: number;
  hitRatio: number;
  lastOptimizedAt?: Date;
}

interface TableStats {
  schemaName: string;
  tableName: string;
  totalSize: string;
  tableSize: string;
  indexSize: string;
  estimatedRows: number;
  sequentialScans: number;
  sequentialTupleReads: number;
  indexScans: number;
  indexTupleReads: number;
  insertions: number;
  updates: number;
  deletions: number;
  hotUpdates: number;
  deadTuples: number;
  lastVacuum?: Date;
  lastAutoVacuum?: Date;
  lastAnalyze?: Date;
  lastAutoAnalyze?: Date;
}

interface OptimizationReport {
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

@Injectable()
export class DatabaseOptimizationService {
  private readonly logger = new Logger(DatabaseOptimizationService.name);
  private readonly maxIndexSize = 100 * 1024 * 1024; // 100MB
  private readonly minIndexUsage = 100; // Minimum scans for keeping index

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly centralizedLogger: CentralizedLoggerService
  ) {}

  /**
   * Perform comprehensive database analysis and optimization
   */
  async performOptimizationAnalysis(): Promise<OptimizationReport> {
    const startTime = Date.now();
    
    try {
      this.logger.log('Starting comprehensive database optimization analysis');

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        // Gather comprehensive database statistics
        const [
          databaseSize,
          tableStats,
          indexAnalysis,
          queryPerformance,
          connectionStats
        ] = await Promise.all([
          this.getDatabaseSize(queryRunner),
          this.getTableStatistics(queryRunner),
          this.analyzeIndexes(queryRunner),
          this.analyzeQueryPerformance(queryRunner),
          this.getConnectionStatistics(queryRunner)
        ]);

        // Generate optimization recommendations
        const recommendations = await this.generateRecommendations(
          tableStats,
          indexAnalysis,
          queryPerformance,
          queryRunner
        );

        // Calculate overall health score
        const healthScore = this.calculateHealthScore(
          tableStats,
          indexAnalysis,
          queryPerformance,
          connectionStats
        );

        const report: OptimizationReport = {
          analysisDate: new Date(),
          databaseSize,
          totalTables: tableStats.length,
          totalIndexes: indexAnalysis.length,
          recommendations,
          healthScore
        };

        // Log analysis completion
        await this.centralizedLogger.auditLog('Database optimization analysis completed', {
          durationMs: Date.now() - startTime,
          healthScore,
          tablesAnalyzed: tableStats.length,
          indexesAnalyzed: indexAnalysis.length,
          recommendationsCount: Object.values(recommendations).reduce((sum, arr) => sum + arr.length, 0),
          service: 'database-optimization'
        });

        return report;

      } finally {
        await queryRunner.release();
      }

    } catch (error) {
      this.logger.error('Database optimization analysis failed', error);
      await this.centralizedLogger.auditLog('Database optimization analysis failed', {
        error: error.message,
        durationMs: Date.now() - startTime,
        service: 'database-optimization'
      });
      throw error;
    }
  }

  /**
   * Apply recommended optimizations
   */
  async applyOptimizations(
    recommendations: OptimizationReport['recommendations'],
    options: {
      createIndexes?: boolean;
      dropIndexes?: boolean;
      runMaintenance?: boolean;
      skipConfirmation?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    appliedOptimizations: string[];
    errors: string[];
    estimatedImprovementMs: number;
  }> {
    const startTime = Date.now();
    const appliedOptimizations: string[] = [];
    const errors: string[] = [];
    let estimatedImprovementMs = 0;

    try {
      this.logger.log('Applying database optimizations');

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        await queryRunner.startTransaction();

        // Create recommended indexes
        if (options.createIndexes !== false) {
          for (const indexRec of recommendations.createIndexes) {
            try {
              await this.createOptimizedIndex(queryRunner, indexRec);
              appliedOptimizations.push(`Created index on ${indexRec.table}(${indexRec.columns.join(', ')})`);
              estimatedImprovementMs += this.parseEstimatedImprovement(indexRec.estimatedImprovement);
            } catch (error) {
              errors.push(`Failed to create index on ${indexRec.table}: ${error.message}`);
            }
          }
        }

        // Drop unused indexes
        if (options.dropIndexes !== false) {
          for (const dropRec of recommendations.dropIndexes) {
            try {
              await this.dropIndex(queryRunner, dropRec.table, dropRec.indexName);
              appliedOptimizations.push(`Dropped unused index ${dropRec.indexName} from ${dropRec.table}`);
            } catch (error) {
              errors.push(`Failed to drop index ${dropRec.indexName}: ${error.message}`);
            }
          }
        }

        await queryRunner.commitTransaction();

        // Run maintenance tasks (outside transaction)
        if (options.runMaintenance !== false) {
          await this.runMaintenanceTasks(queryRunner, recommendations.maintenanceTasks);
        }

        await this.centralizedLogger.auditLog('Database optimizations applied', {
          appliedCount: appliedOptimizations.length,
          errorsCount: errors.length,
          estimatedImprovementMs,
          durationMs: Date.now() - startTime,
          service: 'database-optimization'
        });

        return {
          success: errors.length === 0,
          appliedOptimizations,
          errors,
          estimatedImprovementMs
        };

      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }

    } catch (error) {
      this.logger.error('Failed to apply database optimizations', error);
      throw error;
    }
  }

  /**
   * Get database size information
   */
  private async getDatabaseSize(queryRunner: QueryRunner): Promise<string> {
    const result = await queryRunner.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    return result[0]?.size || 'Unknown';
  }

  /**
   * Get comprehensive table statistics
   */
  private async getTableStatistics(queryRunner: QueryRunner): Promise<TableStats[]> {
    const result = await queryRunner.query(`
      SELECT 
        schemaname as schema_name,
        relname as table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||relname)) as table_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname) - pg_relation_size(schemaname||'.'||relname)) as index_size,
        n_tup_ins as insertions,
        n_tup_upd as updates,
        n_tup_del as deletions,
        n_tup_hot_upd as hot_updates,
        n_dead_tup as dead_tuples,
        seq_scan as sequential_scans,
        seq_tup_read as sequential_tuple_reads,
        idx_scan as index_scans,
        idx_tup_fetch as index_tuple_reads,
        reltuples::bigint as estimated_rows,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables 
      JOIN pg_class ON pg_stat_user_tables.relid = pg_class.oid
      ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC
    `);

    return result.map(row => ({
      schemaName: row.schema_name,
      tableName: row.table_name,
      totalSize: row.total_size,
      tableSize: row.table_size,
      indexSize: row.index_size,
      estimatedRows: parseInt(row.estimated_rows) || 0,
      sequentialScans: parseInt(row.sequential_scans) || 0,
      sequentialTupleReads: parseInt(row.sequential_tuple_reads) || 0,
      indexScans: parseInt(row.index_scans) || 0,
      indexTupleReads: parseInt(row.index_tuple_reads) || 0,
      insertions: parseInt(row.insertions) || 0,
      updates: parseInt(row.updates) || 0,
      deletions: parseInt(row.deletions) || 0,
      hotUpdates: parseInt(row.hot_updates) || 0,
      deadTuples: parseInt(row.dead_tuples) || 0,
      lastVacuum: row.last_vacuum,
      lastAutoVacuum: row.last_autovacuum,
      lastAnalyze: row.last_analyze,
      lastAutoAnalyze: row.last_autoanalyze
    }));
  }

  /**
   * Analyze existing indexes for optimization opportunities
   */
  private async analyzeIndexes(queryRunner: QueryRunner): Promise<IndexAnalysis[]> {
    const result = await queryRunner.query(`
      SELECT 
        schemaname as schema_name,
        tablename as table_name,
        indexname as index_name,
        indexdef as index_definition,
        pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as index_size,
        idx_scan as scans,
        idx_tup_read as tuple_reads,
        idx_tup_fetch as tuple_fetches
      FROM pg_stat_user_indexes 
      JOIN pg_indexes ON pg_stat_user_indexes.indexname = pg_indexes.indexname
      ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC
    `);

    return result.map(row => {
      const indexDef = row.index_definition || '';
      const isUnique = indexDef.includes('UNIQUE');
      const isPartial = indexDef.includes('WHERE');
      
      // Extract columns from index definition
      const columnsMatch = indexDef.match(/\((.*?)\)/);
      const columns = columnsMatch ? 
        columnsMatch[1].split(',').map(col => col.trim().replace(/["']/g, '')) : 
        [];

      // Determine index type
      let indexType = 'btree';
      if (indexDef.includes('USING gin')) indexType = 'gin';
      else if (indexDef.includes('USING gist')) indexType = 'gist';
      else if (indexDef.includes('USING hash')) indexType = 'hash';

      const scans = parseInt(row.scans) || 0;
      const recommendation = this.getIndexRecommendation(row, scans);

      return {
        tableName: row.table_name,
        indexName: row.index_name,
        indexType,
        columns,
        isUnique,
        isPartial,
        size: row.index_size,
        usage: {
          scans,
          tupleReads: parseInt(row.tuple_reads) || 0,
          tupleFetches: parseInt(row.tuple_fetches) || 0
        },
        recommendation: recommendation.action,
        reason: recommendation.reason
      };
    });
  }

  /**
   * Analyze query performance patterns
   */
  private async analyzeQueryPerformance(queryRunner: QueryRunner): Promise<QueryPerformanceMetrics[]> {
    try {
      // Check if pg_stat_statements extension is available
      const extensionCheck = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
        ) as has_extension
      `);

      if (!extensionCheck[0]?.has_extension) {
        this.logger.warn('pg_stat_statements extension not available for query analysis');
        return [];
      }

      const result = await queryRunner.query(`
        SELECT 
          query,
          total_time,
          mean_time,
          calls,
          rows,
          100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) as hit_ratio
        FROM pg_stat_statements 
        WHERE calls > 10
        ORDER BY total_time DESC 
        LIMIT 50
      `);

      return result.map(row => ({
        query: row.query,
        totalTime: parseFloat(row.total_time) || 0,
        meanTime: parseFloat(row.mean_time) || 0,
        calls: parseInt(row.calls) || 0,
        rows: parseInt(row.rows) || 0,
        hitRatio: parseFloat(row.hit_ratio) || 0
      }));

    } catch (error) {
      this.logger.warn('Could not analyze query performance', error.message);
      return [];
    }
  }

  /**
   * Get database connection statistics
   */
  private async getConnectionStatistics(queryRunner: QueryRunner): Promise<any> {
    const result = await queryRunner.query(`
      SELECT 
        max_conn,
        used_conn,
        res_for_super,
        max_conn - used_conn - res_for_super as available_conn,
        ROUND(100.0 * used_conn / max_conn, 2) as usage_percent
      FROM (
        SELECT 
          setting::int as max_conn,
          (SELECT count(*) FROM pg_stat_activity) as used_conn,
          setting::int as res_for_super
        FROM pg_settings 
        WHERE name IN ('max_connections', 'superuser_reserved_connections')
      ) t;
    `);

    return result[0] || {};
  }

  /**
   * Generate comprehensive optimization recommendations
   */
  private async generateRecommendations(
    tableStats: TableStats[],
    indexAnalysis: IndexAnalysis[],
    queryPerformance: QueryPerformanceMetrics[],
    queryRunner: QueryRunner
  ): Promise<OptimizationReport['recommendations']> {
    const recommendations = {
      createIndexes: [],
      dropIndexes: [],
      optimizeQueries: [],
      maintenanceTasks: []
    };

    // Analyze tables for missing indexes
    for (const table of tableStats) {
      if (table.sequentialScans > table.indexScans && table.estimatedRows > 1000) {
        // Suggest indexes for commonly queried columns
        const suggestedIndexes = await this.suggestIndexesForTable(queryRunner, table.tableName);
        recommendations.createIndexes.push(...suggestedIndexes);
      }

      // Suggest maintenance tasks
      if (table.deadTuples > table.estimatedRows * 0.1) {
        recommendations.maintenanceTasks.push({
          task: 'vacuum',
          tables: [table.tableName],
          priority: 'high',
          reason: `High dead tuple ratio (${table.deadTuples}/${table.estimatedRows})`
        });
      }

      if (!table.lastAnalyze || (Date.now() - new Date(table.lastAnalyze).getTime()) > 7 * 24 * 60 * 60 * 1000) {
        recommendations.maintenanceTasks.push({
          task: 'analyze',
          tables: [table.tableName],
          priority: 'medium',
          reason: 'Statistics outdated (>7 days)'
        });
      }
    }

    // Identify unused indexes for removal
    for (const index of indexAnalysis) {
      if (index.recommendation === 'drop') {
        recommendations.dropIndexes.push({
          table: index.tableName,
          indexName: index.indexName,
          reason: index.reason,
          estimatedSavings: index.size
        });
      }
    }

    // Suggest query optimizations
    for (const query of queryPerformance.slice(0, 10)) {
      if (query.meanTime > 100) { // Queries taking >100ms on average
        recommendations.optimizeQueries.push({
          query: query.query.substring(0, 100) + '...',
          currentTime: query.meanTime,
          recommendation: 'Consider adding indexes or optimizing WHERE clauses',
          estimatedImprovement: `${Math.round(query.meanTime * 0.5)}ms per call`
        });
      }
    }

    return recommendations;
  }

  /**
   * Calculate overall database health score
   */
  private calculateHealthScore(
    tableStats: TableStats[],
    indexAnalysis: IndexAnalysis[],
    queryPerformance: QueryPerformanceMetrics[],
    connectionStats: any
  ): number {
    let score = 100;

    // Penalize for high dead tuple ratio
    const avgDeadTupleRatio = tableStats.reduce((sum, table) => 
      sum + (table.deadTuples / Math.max(table.estimatedRows, 1)), 0
    ) / tableStats.length;
    score -= Math.min(avgDeadTupleRatio * 200, 20);

    // Penalize for unused indexes
    const unusedIndexes = indexAnalysis.filter(idx => idx.recommendation === 'drop').length;
    score -= Math.min(unusedIndexes * 2, 15);

    // Penalize for slow queries
    const slowQueries = queryPerformance.filter(q => q.meanTime > 100).length;
    score -= Math.min(slowQueries * 3, 20);

    // Penalize for high connection usage
    if (connectionStats.usage_percent > 80) {
      score -= 10;
    }

    // Penalize for low cache hit ratio
    const avgHitRatio = queryPerformance.reduce((sum, q) => sum + q.hitRatio, 0) / queryPerformance.length;
    if (avgHitRatio < 95) {
      score -= (95 - avgHitRatio) * 2;
    }

    return Math.max(Math.round(score), 0);
  }

  /**
   * Create optimized index based on recommendation
   */
  private async createOptimizedIndex(
    queryRunner: QueryRunner,
    indexRec: any
  ): Promise<void> {
    const indexName = `idx_${indexRec.table}_${indexRec.columns.join('_')}`;
    const indexType = indexRec.type || 'btree';
    
    const createIndexSql = `
      CREATE INDEX CONCURRENTLY ${indexName} 
      ON ${indexRec.table} 
      USING ${indexType} (${indexRec.columns.join(', ')})
    `;

    await queryRunner.query(createIndexSql);
    this.logger.log(`Created index: ${indexName}`);
  }

  /**
   * Drop unused index
   */
  private async dropIndex(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string
  ): Promise<void> {
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS ${indexName}`);
    this.logger.log(`Dropped index: ${indexName}`);
  }

  /**
   * Run maintenance tasks
   */
  private async runMaintenanceTasks(
    queryRunner: QueryRunner,
    tasks: Array<{
      task: 'vacuum' | 'analyze' | 'reindex' | 'cluster';
      tables: string[];
      priority: 'high' | 'medium' | 'low';
      reason: string;
    }>
  ): Promise<void> {
    for (const task of tasks.filter(t => t.priority === 'high')) {
      for (const table of task.tables) {
        try {
          switch (task.task) {
            case 'vacuum':
              await queryRunner.query(`VACUUM ANALYZE ${table}`);
              break;
            case 'analyze':
              await queryRunner.query(`ANALYZE ${table}`);
              break;
            case 'reindex':
              await queryRunner.query(`REINDEX TABLE ${table}`);
              break;
          }
          this.logger.log(`Completed ${task.task} on ${table}`);
        } catch (error) {
          this.logger.error(`Failed ${task.task} on ${table}:`, error.message);
        }
      }
    }
  }

  /**
   * Get index recommendation based on usage statistics
   */
  private getIndexRecommendation(indexRow: any, scans: number): { action: 'keep' | 'drop' | 'optimize'; reason: string } {
    if (indexRow.index_name.endsWith('_pkey')) {
      return { action: 'keep', reason: 'Primary key index' };
    }

    if (scans < this.minIndexUsage) {
      return { action: 'drop', reason: `Low usage: ${scans} scans` };
    }

    const sizeBytes = this.parseSizeToBytes(indexRow.index_size);
    if (sizeBytes > this.maxIndexSize && scans < 1000) {
      return { action: 'drop', reason: `Large size (${indexRow.index_size}) with low usage` };
    }

    return { action: 'keep', reason: 'Active and useful' };
  }

  /**
   * Suggest indexes for a table based on query patterns
   */
  private async suggestIndexesForTable(queryRunner: QueryRunner, tableName: string): Promise<any[]> {
    // This is a simplified implementation
    // In production, you'd analyze query logs and WHERE clauses
    const suggestions = [];

    // Common patterns for clinic application
    if (tableName === 'appointments') {
      suggestions.push({
        table: tableName,
        columns: ['therapist_id', 'start_time'],
        type: 'btree',
        reason: 'Optimize therapist schedule queries',
        estimatedImprovement: '50ms per query'
      });
      
      suggestions.push({
        table: tableName,
        columns: ['client_id', 'status'],
        type: 'btree',
        reason: 'Optimize client appointment lookups',
        estimatedImprovement: '30ms per query'
      });
    }

    return suggestions;
  }

  /**
   * Parse size string to bytes
   */
  private parseSizeToBytes(sizeStr: string): number {
    const match = sizeStr.match(/(\d+(?:\.\d+)?)\s*(\w+)/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    const multipliers = {
      'bytes': 1,
      'kb': 1024,
      'mb': 1024 * 1024,
      'gb': 1024 * 1024 * 1024
    };

    return value * (multipliers[unit] || 1);
  }

  /**
   * Parse estimated improvement string to milliseconds
   */
  private parseEstimatedImprovement(improvement: string): number {
    const match = improvement.match(/(\d+)ms/);
    return match ? parseInt(match[1]) : 0;
  }
}