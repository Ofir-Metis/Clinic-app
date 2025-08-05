import { Injectable } from '@nestjs/common';
import { ElasticsearchService, SearchQuery } from '../elasticsearch/elasticsearch.service';
import { StructuredLoggerService } from '@clinic/common';
import { SearchDto, GlobalSearchDto, AutocompleteDto, SearchResultDto } from './dto/search.dto';

@Injectable()
export class SearchService {
  constructor(
    private readonly elasticsearch: ElasticsearchService,
    private readonly logger: StructuredLoggerService,
  ) {}

  /**
   * Search within a specific index
   */
  async searchIndex<T = any>(index: string, searchDto: SearchDto): Promise<SearchResultDto<T>> {
    const searchQuery: SearchQuery = {
      query: searchDto.query,
      filters: searchDto.filters,
      sort: searchDto.sort,
      from: searchDto.from,
      size: searchDto.size,
    };

    const result = await this.elasticsearch.search<T>(index, searchQuery);
    
    return {
      ...result,
      pagination: {
        from: searchDto.from || 0,
        size: searchDto.size || 20,
        hasNext: (searchDto.from || 0) + (searchDto.size || 20) < result.total,
        hasPrevious: (searchDto.from || 0) > 0,
      },
    };
  }

  /**
   * Global search across multiple indices
   */
  async globalSearch(searchDto: GlobalSearchDto): Promise<SearchResultDto> {
    const indices = searchDto.types || ['clients', 'appointments', 'session-notes', 'files', 'coaches'];
    
    const searchQuery: SearchQuery = {
      query: searchDto.query,
      filters: searchDto.filters,
      sort: searchDto.sort,
      from: searchDto.from,
      size: searchDto.size,
    };

    this.logger.info('Performing global search', {
      service: 'search-service',
      query: searchDto.query,
      indices,
      filters: searchDto.filters,
    });

    const result = await this.elasticsearch.multiSearch(indices, searchQuery);
    
    return {
      ...result,
      pagination: {
        from: searchDto.from || 0,
        size: searchDto.size || 20,
        hasNext: (searchDto.from || 0) + (searchDto.size || 20) < result.total,
        hasPrevious: (searchDto.from || 0) > 0,
      },
    };
  }

  /**
   * Search clients
   */
  async searchClients(searchDto: SearchDto): Promise<SearchResultDto> {
    return this.searchIndex('clients', searchDto);
  }

  /**
   * Search appointments
   */
  async searchAppointments(searchDto: SearchDto): Promise<SearchResultDto> {
    return this.searchIndex('appointments', searchDto);
  }

  /**
   * Search session notes
   */
  async searchSessionNotes(searchDto: SearchDto): Promise<SearchResultDto> {
    return this.searchIndex('session-notes', searchDto);
  }

  /**
   * Search files
   */
  async searchFiles(searchDto: SearchDto): Promise<SearchResultDto> {
    return this.searchIndex('files', searchDto);
  }

  /**
   * Search coaches
   */
  async searchCoaches(searchDto: SearchDto): Promise<SearchResultDto> {
    return this.searchIndex('coaches', searchDto);
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocompleteSuggestions(index: string, autocompleteDto: AutocompleteDto): Promise<string[]> {
    return this.elasticsearch.getSuggestions(
      index,
      autocompleteDto.field || 'title',
      autocompleteDto.query,
      autocompleteDto.size || 5,
    );
  }

  /**
   * Advanced search with faceted filters
   */
  async advancedSearch(searchDto: SearchDto & { facets?: string[] }): Promise<SearchResultDto & { facets?: Record<string, any> }> {
    const searchQuery: SearchQuery = {
      query: searchDto.query,
      filters: searchDto.filters,
      sort: searchDto.sort,
      from: searchDto.from,
      size: searchDto.size,
    };

    // Add aggregations for faceted search
    const elasticsearchQuery = this.buildAdvancedQuery(searchQuery, searchDto.facets);
    
    const indices = ['clients', 'appointments', 'session-notes', 'files', 'coaches'];
    const response = await this.elasticsearch['client'].search({
      index: indices.join(','),
      body: elasticsearchQuery,
    });

    const result = {
      hits: response.body.hits.hits.map((hit: any) => ({
        _id: hit._id,
        _score: hit._score,
        _source: hit._source,
        highlight: hit.highlight,
      })),
      total: response.body.hits.total.value,
      took: response.body.took,
      aggregations: response.body.aggregations,
      pagination: {
        from: searchDto.from || 0,
        size: searchDto.size || 20,
        hasNext: (searchDto.from || 0) + (searchDto.size || 20) < response.body.hits.total.value,
        hasPrevious: (searchDto.from || 0) > 0,
      },
    };

    // Extract facets from aggregations
    if (response.body.aggregations) {
      result['facets'] = this.extractFacets(response.body.aggregations);
    }

    return result;
  }

  /**
   * Similar documents search
   */
  async findSimilar(index: string, documentId: string, fields: string[] = []): Promise<SearchResultDto> {
    try {
      const response = await this.elasticsearch['client'].search({
        index,
        body: {
          query: {
            more_like_this: {
              fields: fields.length > 0 ? fields : ['title', 'description', 'content'],
              like: [
                {
                  _index: index,
                  _id: documentId,
                },
              ],
              min_term_freq: 2,
              max_query_terms: 12,
            },
          },
          size: 10,
        },
      });

      return {
        hits: response.body.hits.hits.map((hit: any) => ({
          _id: hit._id,
          _score: hit._score,
          _source: hit._source,
        })),
        total: response.body.hits.total.value,
        took: response.body.took,
      };
    } catch (error) {
      this.logger.error('Similar search failed', {
        service: 'search-service',
        index,
        documentId,
        error: error.message,
      });
      return { hits: [], total: 0, took: 0 };
    }
  }

  /**
   * Build advanced Elasticsearch query with aggregations
   */
  private buildAdvancedQuery(searchQuery: SearchQuery, facets?: string[]): any {
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

    // Add aggregations for faceted search
    if (facets && facets.length > 0) {
      query.aggs = {};
      facets.forEach(facet => {
        query.aggs[facet] = {
          terms: {
            field: `${facet}.keyword`,
            size: 10,
          },
        };
      });
    }

    return query;
  }

  /**
   * Extract facets from Elasticsearch aggregations
   */
  private extractFacets(aggregations: any): Record<string, any> {
    const facets: Record<string, any> = {};
    
    Object.entries(aggregations).forEach(([key, value]: [string, any]) => {
      if (value.buckets) {
        facets[key] = value.buckets.map((bucket: any) => ({
          value: bucket.key,
          count: bucket.doc_count,
        }));
      }
    });

    return facets;
  }
}