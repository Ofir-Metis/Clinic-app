import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client } from '@elasticsearch/elasticsearch';
import { StructuredLoggerService } from '@clinic/common';

export interface SearchQuery {
  query: string;
  filters?: Record<string, any>;
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
  from?: number;
  size?: number;
}

export interface SearchResult<T = any> {
  hits: Array<{
    _id: string;
    _score: number;
    _source: T;
    highlight?: Record<string, string[]>;
  }>;
  total: number;
  took: number;
  aggregations?: Record<string, any>;
}

@Injectable()
export class ElasticsearchService implements OnModuleInit, OnModuleDestroy {
  private client: Client;

  constructor(private readonly logger: StructuredLoggerService) {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth: process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD ? {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD,
      } : undefined,
      maxRetries: 5,
      requestTimeout: 60000,
      sniffOnStart: false,
    });
  }

  async onModuleInit() {
    try {
      await this.client.ping();
      this.logger.info('Connected to Elasticsearch', {
        service: 'search-service',
        component: 'elasticsearch',
      });
      
      // Initialize indices
      await this.initializeIndices();
    } catch (error) {
      this.logger.error('Failed to connect to Elasticsearch', {
        service: 'search-service',
        component: 'elasticsearch',
        error: error.message,
      });
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  /**
   * Initialize Elasticsearch indices with proper mappings
   */
  private async initializeIndices(): Promise<void> {
    const indices = [
      {
        name: 'clients',
        mapping: {
          properties: {
            firstName: { type: 'text', analyzer: 'standard' },
            lastName: { type: 'text', analyzer: 'standard' },
            email: { type: 'keyword' },
            phone: { type: 'keyword' },
            dateOfBirth: { type: 'date' },
            tags: { type: 'keyword' },
            notes: { type: 'text', analyzer: 'standard' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
            isActive: { type: 'boolean' },
          },
        },
      },
      {
        name: 'appointments',
        mapping: {
          properties: {
            title: { type: 'text', analyzer: 'standard' },
            description: { type: 'text', analyzer: 'standard' },
            clientId: { type: 'keyword' },
            coachId: { type: 'keyword' },
            startTime: { type: 'date' },
            endTime: { type: 'date' },
            type: { type: 'keyword' },
            status: { type: 'keyword' },
            tags: { type: 'keyword' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
          },
        },
      },
      {
        name: 'session-notes',
        mapping: {
          properties: {
            title: { type: 'text', analyzer: 'standard' },
            content: { type: 'text', analyzer: 'standard' },
            summary: { type: 'text', analyzer: 'standard' },
            appointmentId: { type: 'keyword' },
            clientId: { type: 'keyword' },
            coachId: { type: 'keyword' },
            tags: { type: 'keyword' },
            mood: { type: 'keyword' },
            progressNotes: { type: 'text', analyzer: 'standard' },
            actionItems: { type: 'text', analyzer: 'standard' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
          },
        },
      },
      {
        name: 'files',
        mapping: {
          properties: {
            fileName: { type: 'text', analyzer: 'standard' },
            description: { type: 'text', analyzer: 'standard' },
            mimeType: { type: 'keyword' },
            category: { type: 'keyword' },
            tags: { type: 'keyword' },
            ownerId: { type: 'keyword' },
            clientId: { type: 'keyword' },
            appointmentId: { type: 'keyword' },
            extractedText: { type: 'text', analyzer: 'standard' },
            metadata: { type: 'object' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
          },
        },
      },
      {
        name: 'coaches',
        mapping: {
          properties: {
            firstName: { type: 'text', analyzer: 'standard' },
            lastName: { type: 'text', analyzer: 'standard' },
            email: { type: 'keyword' },
            phone: { type: 'keyword' },
            bio: { type: 'text', analyzer: 'standard' },
            specializations: { type: 'keyword' },
            certifications: { type: 'text', analyzer: 'standard' },
            languages: { type: 'keyword' },
            location: { type: 'geo_point' },
            rating: { type: 'float' },
            reviewCount: { type: 'integer' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
          },
        },
      },
    ];

    for (const index of indices) {
      try {
        const exists = await this.client.indices.exists({ index: index.name });
        
        if (!exists) {
          await this.client.indices.create({
            index: index.name,
            body: {
              mappings: index.mapping,
              settings: {
                number_of_shards: 1,
                number_of_replicas: 0,
                analysis: {
                  analyzer: {
                    healthcare_analyzer: {
                      type: 'custom',
                      tokenizer: 'standard',
                      filter: ['lowercase', 'stop', 'snowball'],
                    },
                  },
                },
              },
            },
          });
          
          this.logger.info(`Created Elasticsearch index: ${index.name}`, {
            service: 'search-service',
            component: 'elasticsearch',
            index: index.name,
          });
        }
      } catch (error) {
        this.logger.error(`Failed to create index: ${index.name}`, {
          service: 'search-service',
          component: 'elasticsearch',
          index: index.name,
          error: error.message,
        });
      }
    }
  }

  /**
   * Index a document
   */
  async indexDocument(index: string, id: string, document: any): Promise<void> {
    try {
      await this.client.index({
        index,
        id,
        body: document,
        refresh: 'wait_for',
      });
      
      this.logger.debug(`Indexed document: ${id}`, {
        service: 'search-service',
        component: 'elasticsearch',
        index,
        documentId: id,
      });
    } catch (error) {
      this.logger.error(`Failed to index document: ${id}`, {
        service: 'search-service',
        component: 'elasticsearch',
        index,
        documentId: id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Bulk index documents
   */
  async bulkIndex(index: string, documents: Array<{ id: string; body: any }>): Promise<void> {
    try {
      const body = documents.flatMap(doc => [
        { index: { _index: index, _id: doc.id } },
        doc.body,
      ]);

      const response = await this.client.bulk({
        body,
        refresh: 'wait_for',
      });

      if (response.body.errors) {
        const errors = response.body.items
          .filter((item: any) => item.index?.error)
          .map((item: any) => item.index.error);
        
        this.logger.error('Bulk indexing errors', {
          service: 'search-service',
          component: 'elasticsearch',
          index,
          errors,
        });
      }
      
      this.logger.info(`Bulk indexed ${documents.length} documents`, {
        service: 'search-service',
        component: 'elasticsearch',
        index,
        count: documents.length,
      });
    } catch (error) {
      this.logger.error('Failed to bulk index documents', {
        service: 'search-service',
        component: 'elasticsearch',
        index,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Search documents
   */
  async search<T = any>(index: string, searchQuery: SearchQuery): Promise<SearchResult<T>> {
    try {
      const query = this.buildElasticsearchQuery(searchQuery);
      
      const response = await this.client.search({
        index,
        body: query,
      });

      return {
        hits: response.body.hits.hits.map((hit: any) => ({
          _id: hit._id,
          _score: hit._score,
          _source: hit._source,
          highlight: hit.highlight,
        })),
        total: response.body.hits.total.value,
        took: response.body.took,
        aggregations: response.body.aggregations,
      };
    } catch (error) {
      this.logger.error('Search failed', {
        service: 'search-service',
        component: 'elasticsearch',
        index,
        query: searchQuery.query,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Multi-index search
   */
  async multiSearch<T = any>(indices: string[], searchQuery: SearchQuery): Promise<SearchResult<T>> {
    try {
      const query = this.buildElasticsearchQuery(searchQuery);
      
      const response = await this.client.search({
        index: indices.join(','),
        body: query,
      });

      return {
        hits: response.body.hits.hits.map((hit: any) => ({
          _id: hit._id,
          _score: hit._score,
          _source: hit._source,
          highlight: hit.highlight,
        })),
        total: response.body.hits.total.value,
        took: response.body.took,
        aggregations: response.body.aggregations,
      };
    } catch (error) {
      this.logger.error('Multi-search failed', {
        service: 'search-service',
        component: 'elasticsearch',
        indices,
        query: searchQuery.query,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(index: string, id: string): Promise<void> {
    try {
      await this.client.delete({
        index,
        id,
        refresh: 'wait_for',
      });
      
      this.logger.debug(`Deleted document: ${id}`, {
        service: 'search-service',
        component: 'elasticsearch',
        index,
        documentId: id,
      });
    } catch (error) {
      if (error.statusCode !== 404) {
        this.logger.error(`Failed to delete document: ${id}`, {
          service: 'search-service',
          component: 'elasticsearch',
          index,
          documentId: id,
          error: error.message,
        });
        throw error;
      }
    }
  }

  /**
   * Get suggestions for autocomplete
   */
  async getSuggestions(index: string, field: string, query: string, size = 5): Promise<string[]> {
    try {
      const response = await this.client.search({
        index,
        body: {
          suggest: {
            suggestions: {
              prefix: query,
              completion: {
                field: `${field}.suggest`,
                size,
              },
            },
          },
        },
      });

      return response.body.suggest.suggestions[0].options.map((option: any) => option.text);
    } catch (error) {
      this.logger.error('Failed to get suggestions', {
        service: 'search-service',
        component: 'elasticsearch',
        index,
        field,
        query,
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Build Elasticsearch query from search parameters
   */
  private buildElasticsearchQuery(searchQuery: SearchQuery): any {
    const query: any = {
      from: searchQuery.from || 0,
      size: searchQuery.size || 20,
      query: {
        bool: {
          must: [],
          filter: [],
        },
      },
      highlight: {
        fields: {
          '*': {},
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
      },
    };

    // Main search query
    if (searchQuery.query) {
      query.query.bool.must.push({
        multi_match: {
          query: searchQuery.query,
          fields: ['*'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    } else {
      query.query.bool.must.push({
        match_all: {},
      });
    }

    // Apply filters
    if (searchQuery.filters) {
      Object.entries(searchQuery.filters).forEach(([field, value]) => {
        if (Array.isArray(value)) {
          query.query.bool.filter.push({
            terms: { [field]: value },
          });
        } else if (typeof value === 'object' && value.range) {
          query.query.bool.filter.push({
            range: { [field]: value.range },
          });
        } else {
          query.query.bool.filter.push({
            term: { [field]: value },
          });
        }
      });
    }

    // Apply sorting
    if (searchQuery.sort) {
      query.sort = searchQuery.sort.map(sort => ({
        [sort.field]: { order: sort.order },
      }));
    }

    return query;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; cluster?: any }> {
    try {
      const health = await this.client.cluster.health();
      return {
        status: 'healthy',
        cluster: health.body,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
      };
    }
  }
}