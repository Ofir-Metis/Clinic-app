import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Repository } from 'typeorm';

export const SECURE_REPOSITORY_KEY = 'secure_repository';

/**
 * Decorator to mark a repository as requiring secure query validation
 */
export const SecureRepository = (options?: {
  allowRawQueries?: boolean;
  maxResults?: number;
}) => SetMetadata(SECURE_REPOSITORY_KEY, options || {});

/**
 * Parameter decorator to inject validated query parameters
 */
export const ValidatedQuery = createParamDecorator(
  (field: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const query = request.query;
    
    if (field) {
      return validateQueryParameter(query[field], field);
    }
    
    // Validate all query parameters
    const validatedQuery = {};
    for (const [key, value] of Object.entries(query)) {
      validatedQuery[key] = validateQueryParameter(value, key);
    }
    
    return validatedQuery;
  },
);

/**
 * Parameter decorator for validated pagination parameters
 */
export const ValidatedPagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const { page = 1, limit = 20, sortBy, sortOrder = 'ASC' } = request.query;
    
    // Validate pagination parameters
    const validatedPage = Math.max(1, parseInt(page as string) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    
    // Validate sort parameters
    let validatedSortBy = null;
    if (sortBy) {
      if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(sortBy as string)) {
        throw new Error('Invalid sort field name');
      }
      validatedSortBy = sortBy as string;
    }
    
    const validatedSortOrder = (sortOrder as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    return {
      page: validatedPage,
      limit: validatedLimit,
      offset: (validatedPage - 1) * validatedLimit,
      sortBy: validatedSortBy,
      sortOrder: validatedSortOrder as 'ASC' | 'DESC'
    };
  },
);

/**
 * Validate individual query parameter
 */
function validateQueryParameter(value: any, field: string): any {
  if (value === undefined || value === null) {
    return value;
  }
  
  // Convert to string for validation
  const strValue = String(value);
  
  // Check for SQL injection patterns
  const dangerousPatterns = [
    /union\s+select/i,
    /or\s+\d+\s*=\s*\d+/i,
    /and\s+\d+\s*=\s*\d+/i,
    /';\s*(drop|delete|insert|update|create|alter)/i,
    /--/,
    /\/\*/,
    /exec\s*\(/i,
    /xp_\w+/i,
    /sp_\w+/i
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(strValue)) {
      throw new Error(`Invalid value for parameter '${field}': contains potentially dangerous content`);
    }
  }
  
  // Length validation
  if (strValue.length > 1000) {
    throw new Error(`Parameter '${field}' is too long (max 1000 characters)`);
  }
  
  // Return original value if validation passes
  return value;
}

/**
 * Decorator for secure text search parameters
 */
export const SecureSearchQuery = createParamDecorator(
  (field: string = 'search', ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const searchValue = request.query[field];
    
    if (!searchValue) {
      return null;
    }
    
    const cleanSearch = String(searchValue)
      .trim()
      .replace(/[%_]/g, '\\$&') // Escape SQL LIKE wildcards
      .substring(0, 200); // Limit length
    
    // Validate search doesn't contain dangerous patterns
    validateQueryParameter(cleanSearch, field);
    
    return cleanSearch;
  },
);

/**
 * Decorator for secure numeric ID parameters
 */
export const SecureId = createParamDecorator(
  (field: string = 'id', ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const idValue = request.params[field] || request.query[field];
    
    if (!idValue) {
      throw new Error(`Required parameter '${field}' is missing`);
    }
    
    // Validate ID is a valid number or UUID
    const id = String(idValue).trim();
    
    // Check if it's a valid integer
    if (/^\d+$/.test(id)) {
      const numId = parseInt(id);
      if (numId <= 0 || numId > Number.MAX_SAFE_INTEGER) {
        throw new Error(`Invalid ${field}: must be a positive integer`);
      }
      return numId;
    }
    
    // Check if it's a valid UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return id;
    }
    
    throw new Error(`Invalid ${field}: must be a valid ID or UUID`);
  },
);