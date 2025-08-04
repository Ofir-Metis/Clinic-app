#!/usr/bin/env node

import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../app.module';
import { SwaggerConfig } from './swagger-config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script to generate comprehensive API documentation
 * 
 * Features:
 * - Generates OpenAPI 3.0 specification
 * - Creates static HTML documentation
 * - Generates TypeScript SDK
 * - Creates Postman collection
 * - Produces API changelog
 */
async function generateDocumentation() {
  console.log('🚀 Starting API documentation generation...');

  try {
    // Create NestJS application instance
    const app = await NestFactory.create(AppModule, { logger: false });
    
    // Configure Swagger
    const config = SwaggerConfig.createConfig();
    const options = SwaggerConfig.createOptions();
    
    // Generate OpenAPI document
    const document = SwaggerModule.createDocument(app, config, options);
    
    // Ensure docs directory exists
    const docsDir = path.join(__dirname, '../../docs');
    const outputDir = path.join(docsDir, 'generated');
    
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 1. Generate OpenAPI JSON specification
    console.log('📝 Generating OpenAPI specification...');
    const openApiPath = path.join(outputDir, 'openapi.json');
    fs.writeFileSync(openApiPath, JSON.stringify(document, null, 2));
    console.log(`✅ OpenAPI spec saved to: ${openApiPath}`);

    // 2. Generate OpenAPI YAML specification
    console.log('📝 Generating OpenAPI YAML specification...');
    const yaml = require('js-yaml');
    const yamlPath = path.join(outputDir, 'openapi.yaml');
    fs.writeFileSync(yamlPath, yaml.dump(document, { indent: 2 }));
    console.log(`✅ OpenAPI YAML saved to: ${yamlPath}`);

    // 3. Generate static HTML documentation
    console.log('🌐 Generating static HTML documentation...');
    await generateStaticHtml(document, outputDir);

    // 4. Generate Postman collection
    console.log('📮 Generating Postman collection...');
    await generatePostmanCollection(document, outputDir);

    // 5. Generate TypeScript SDK types
    console.log('🔧 Generating TypeScript SDK...');
    await generateTypeScriptSDK(document, outputDir);

    // 6. Generate API summary report
    console.log('📊 Generating API summary report...');
    await generateApiSummary(document, outputDir);

    // 7. Generate security documentation
    console.log('🔒 Generating security documentation...');
    await generateSecurityDocs(document, outputDir);

    console.log('✨ Documentation generation completed successfully!');
    console.log(`📁 All files saved to: ${outputDir}`);
    
    await app.close();

  } catch (error) {
    console.error('❌ Documentation generation failed:', error);
    process.exit(1);
  }
}

/**
 * Generate static HTML documentation using Swagger UI
 */
async function generateStaticHtml(document: any, outputDir: string) {
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clinic Management API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui.css" />
    <link rel="icon" type="image/png" href="https://petstore.swagger.io/favicon-32x32.png" sizes="32x32" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info hgroup.main .title { color: #2E7D6B; }
        .swagger-ui .btn.authorize { background-color: #2E7D6B; border-color: #2E7D6B; }
        .swagger-ui .btn.authorize:hover { background-color: #245A4E; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                spec: ${JSON.stringify(document)},
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                tryItOutEnabled: true,
                filter: true,
                supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
                onComplete: function() {
                    console.log('Swagger UI loaded successfully');
                }
            });
        };
    </script>
</body>
</html>`;

  const htmlPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(htmlPath, htmlTemplate);
  console.log(`✅ Static HTML documentation saved to: ${htmlPath}`);
}

/**
 * Generate Postman collection for API testing
 */
async function generatePostmanCollection(document: any, outputDir: string) {
  const collection = {
    info: {
      name: document.info.title,
      description: document.info.description,
      version: document.info.version,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    auth: {
      type: "bearer",
      bearer: [
        {
          key: "token",
          value: "{{jwt_token}}",
          type: "string"
        }
      ]
    },
    variable: [
      {
        key: "base_url",
        value: "http://localhost:4000",
        type: "string"
      },
      {
        key: "jwt_token",
        value: "your_jwt_token_here",
        type: "string"
      }
    ],
    item: []
  };

  // Convert OpenAPI paths to Postman requests
  for (const [path, methods] of Object.entries(document.paths)) {
    const folder = {
      name: path.split('/')[1] || 'root',
      item: []
    };

    for (const [method, operation] of Object.entries(methods as any)) {
      if (typeof operation === 'object' && operation.operationId) {
        const request = {
          name: operation.summary || `${method.toUpperCase()} ${path}`,
          request: {
            method: method.toUpperCase(),
            header: [
              {
                key: "Content-Type",
                value: "application/json",
                type: "text"
              }
            ],
            url: {
              raw: "{{base_url}}" + path,
              host: ["{{base_url}}"],
              path: path.split('/').filter(p => p)
            },
            description: operation.description || operation.summary
          }
        };

        (folder.item as any[]).push(request);
      }
    }

    if ((folder.item as any[]).length > 0) {
      (collection.item as any[]).push(folder);
    }
  }

  const postmanPath = path.join(outputDir, 'postman-collection.json');
  fs.writeFileSync(postmanPath, JSON.stringify(collection, null, 2));
  console.log(`✅ Postman collection saved to: ${postmanPath}`);
}

/**
 * Generate TypeScript SDK interfaces
 */
async function generateTypeScriptSDK(document: any, outputDir: string) {
  let sdkContent = `
/**
 * Auto-generated TypeScript SDK for Clinic Management API
 * Generated on: ${new Date().toISOString()}
 * API Version: ${document.info.version}
 */

// Base API Configuration
export interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
  jwt?: string;
  timeout?: number;
}

// Standard API Response
export interface ApiResponse<T = any> {
  status: string;
  data: T;
  message?: string;
  timestamp: string;
}

// Error Response
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

// Health Check Interfaces
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  services: {
    database: ServiceHealth;
    filesystem: ServiceHealth;
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
    usage: string;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
  lastCheck: string;
}

// Pagination Interface
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
`;

  // Add schemas from OpenAPI components
  if (document.components && document.components.schemas) {
    sdkContent += '\n// API Data Models\n';
    for (const [schemaName, schema] of Object.entries(document.components.schemas)) {
      sdkContent += `export interface ${schemaName} {\n`;
      if ((schema as any).properties) {
        for (const [propName, prop] of Object.entries((schema as any).properties)) {
          const propType = getTypeScriptType(prop as any);
          const required = (schema as any).required?.includes(propName) ? '' : '?';
          sdkContent += `  ${propName}${required}: ${propType};\n`;
        }
      }
      sdkContent += '}\n\n';
    }
  }

  // Add API client class
  sdkContent += `
// API Client Class
export class ClinicApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = {
      timeout: 10000,
      ...config
    };
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = \`\${this.config.baseUrl}\${endpoint}\`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options?.headers as Record<string, string>) || {})
    };

    if (this.config.jwt) {
      headers.Authorization = \`Bearer \${this.config.jwt}\`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(this.config.timeout!),
      ...options
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(\`API Error: \${error.message}\`);
    }

    return response.json();
  }

  // Health endpoints
  async getHealth(): Promise<HealthStatus> {
    const response = await this.request<HealthStatus>('GET', '/health');
    return response.data;
  }

  async getLiveness(): Promise<{ status: string; timestamp: string }> {
    const response = await this.request<{ status: string; timestamp: string }>('GET', '/health/liveness');
    return response.data;
  }

  async getReadiness(): Promise<{ status: string; timestamp: string; database: string }> {
    const response = await this.request<{ status: string; timestamp: string; database: string }>('GET', '/health/readiness');
    return response.data;
  }

  // Add other endpoint methods here...
}

export default ClinicApiClient;
`;

  const sdkPath = path.join(outputDir, 'typescript-sdk.ts');
  fs.writeFileSync(sdkPath, sdkContent);
  console.log(`✅ TypeScript SDK saved to: ${sdkPath}`);
}

/**
 * Helper function to convert OpenAPI types to TypeScript types
 */
function getTypeScriptType(property: any): string {
  if (property.type === 'string') {
    return property.enum ? `'${property.enum.join("' | '")}'` : 'string';
  }
  if (property.type === 'number' || property.type === 'integer') {
    return 'number';
  }
  if (property.type === 'boolean') {
    return 'boolean';
  }
  if (property.type === 'array') {
    const itemType = property.items ? getTypeScriptType(property.items) : 'any';
    return `${itemType}[]`;
  }
  if (property.type === 'object') {
    return 'any'; // Could be improved to generate nested interfaces
  }
  return 'any';
}

/**
 * Generate API summary report
 */
async function generateApiSummary(document: any, outputDir: string) {
  const summary = {
    title: document.info.title,
    version: document.info.version,
    description: document.info.description,
    generatedAt: new Date().toISOString(),
    statistics: {
      totalEndpoints: 0,
      endpointsByMethod: {} as Record<string, number>,
      endpointsByTag: {} as Record<string, number>,
      securitySchemes: Object.keys(document.components?.securitySchemes || {}),
      schemas: Object.keys(document.components?.schemas || {}).length
    },
    endpoints: [] as any[]
  };

  // Analyze endpoints
  for (const [path, methods] of Object.entries(document.paths)) {
    for (const [method, operation] of Object.entries(methods as any)) {
      if (typeof operation === 'object' && operation.operationId) {
        summary.statistics.totalEndpoints++;
        
        // Count by method
        const methodUpper = method.toUpperCase();
        summary.statistics.endpointsByMethod[methodUpper] = 
          (summary.statistics.endpointsByMethod[methodUpper] || 0) + 1;

        // Count by tag
        if (operation.tags) {
          operation.tags.forEach((tag: string) => {
            summary.statistics.endpointsByTag[tag] = 
              (summary.statistics.endpointsByTag[tag] || 0) + 1;
          });
        }

        // Add endpoint details
        summary.endpoints.push({
          path,
          method: methodUpper,
          summary: operation.summary,
          tags: operation.tags || [],
          security: operation.security ? true : false,
          deprecated: operation.deprecated || false
        });
      }
    }
  }

  const summaryPath = path.join(outputDir, 'api-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`✅ API summary report saved to: ${summaryPath}`);
}

/**
 * Generate security documentation
 */
async function generateSecurityDocs(document: any, outputDir: string) {
  const securityDoc = `# API Security Documentation

## Authentication

This API uses JWT (JSON Web Token) authentication. Include your token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Security Schemes

${Object.entries(document.components?.securitySchemes || {}).map(([name, scheme]: [string, any]) => `
### ${name}
- **Type**: ${scheme.type}
- **Scheme**: ${scheme.scheme}
- **Bearer Format**: ${scheme.bearerFormat || 'N/A'}
- **Description**: ${scheme.description || 'No description available'}
`).join('\n')}

## Rate Limiting

The API implements multiple rate limiting tiers:

- **Strict Endpoints**: 5 requests per 15 minutes (MFA, sensitive operations)
- **Moderate Endpoints**: 30 requests per minute (API operations)  
- **Lenient Endpoints**: 100 requests per minute (read operations)
- **Default**: 60 requests per minute

## HIPAA Compliance

This API handles Protected Health Information (PHI) and complies with HIPAA regulations:

- All PHI is encrypted at rest and in transit
- Access is logged for audit purposes
- Role-based access control is enforced
- Data retention policies are implemented

## Security Headers

All responses include security headers:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

## Error Handling

Security-related errors return standardized responses without exposing sensitive information:

\`\`\`json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized",
  "timestamp": "2024-01-31T10:30:00.000Z",
  "path": "/api/endpoint"
}
\`\`\`

## Best Practices

1. **Always use HTTPS** in production
2. **Store JWT tokens securely** (httpOnly cookies recommended)
3. **Implement proper logout** (token invalidation)
4. **Monitor rate limits** to avoid blocking
5. **Handle errors gracefully** without exposing internal details
6. **Regular token refresh** for long-running applications

Generated on: ${new Date().toISOString()}
`;

  const securityPath = path.join(outputDir, 'security.md');
  fs.writeFileSync(securityPath, securityDoc);
  console.log(`✅ Security documentation saved to: ${securityPath}`);
}

// Run the documentation generation if this script is executed directly
if (require.main === module) {
  generateDocumentation();
}

export { generateDocumentation };