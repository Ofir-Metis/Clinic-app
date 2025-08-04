# Clinic Management API Documentation

## 📚 Overview

This directory contains comprehensive documentation for the Clinic Management Platform API, including interactive documentation, static exports, and development tools.

## 🚀 Quick Start

### View Live Documentation
```bash
# Start the API Gateway in development mode
npm run start:dev

# Visit the interactive documentation
open http://localhost:4000/api-docs
```

### Generate Static Documentation
```bash
# Generate all documentation formats
npm run docs:generate

# Build and generate in one command
npm run docs:build

# Generate and serve locally
npm run docs:serve
```

## 📖 Documentation Types

### 1. Interactive Documentation (Swagger UI)
- **URL**: `http://localhost:4000/api-docs` (development)
- **Features**: 
  - Try-it-out functionality
  - JWT authentication
  - Real-time API testing
  - Healthcare-specific examples

### 2. Static HTML Documentation
- **Location**: `docs/generated/index.html`
- **Features**:
  - Offline browsing
  - Self-contained HTML file
  - Custom styling for healthcare branding

### 3. OpenAPI Specifications
- **JSON**: `docs/generated/openapi.json`
- **YAML**: `docs/generated/openapi.yaml`
- **Use Cases**:
  - Import into Postman
  - Generate client SDKs
  - API contract validation

### 4. TypeScript SDK
- **Location**: `docs/generated/typescript-sdk.ts`
- **Features**:
  - Type-safe API client
  - Auto-generated interfaces
  - Error handling
  - JWT authentication support

### 5. Postman Collection
- **Location**: `docs/generated/postman-collection.json`
- **Features**:
  - Pre-configured requests
  - Environment variables
  - Authentication setup
  - Organized by API endpoints

## 🏥 Healthcare-Specific Features

### HIPAA Compliance Documentation
- **Security documentation**: `docs/generated/security.md`
- **Audit trail requirements**
- **PHI data handling guidelines**
- **Access control specifications**

### Rate Limiting Tiers
- **Strict**: 5 requests/15min (MFA operations)
- **Moderate**: 30 requests/min (Standard API)
- **Lenient**: 100 requests/min (Read operations)

### Authentication & Authorization
- **JWT Bearer tokens** for all endpoints
- **Role-based access control** (client, therapist, admin)
- **Multi-factor authentication** for sensitive operations
- **Session management** with secure cookies

## 🛠️ Development

### Adding Documentation to New Endpoints

1. **Import Swagger decorators**:
```typescript
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
```

2. **Add controller-level tags**:
```typescript
@ApiTags('Your Feature')
@Controller('your-feature')
export class YourController {
```

3. **Document individual endpoints**:
```typescript
@Get()
@ApiOperation({
  summary: 'Brief description',
  description: 'Detailed description with markdown support'
})
@ApiResponse({
  status: 200,
  description: 'Success response',
  schema: { /* OpenAPI schema */ }
})
async getItems() {
  // Implementation
}
```

### Creating DTOs with Documentation

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateItemDto {
  @ApiProperty({
    description: 'Item name',
    example: 'Sample Item',
    minLength: 1,
    maxLength: 100
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Item description',
    required: false,
    example: 'Optional description'
  })
  @IsOptional()
  @IsString()
  description?: string;
}
```

### Custom Documentation Scripts

```bash
# Generate only OpenAPI specs
npm run docs:generate

# Serve documentation locally
npm run docs:serve

# Full build and documentation pipeline
npm run docs:build
```

## 📊 API Statistics

The generated documentation includes comprehensive API analytics:

- **Total Endpoints**: Automatically counted
- **Endpoints by Method**: GET, POST, PUT, DELETE, PATCH
- **Endpoints by Category**: Organized by controller tags
- **Security Coverage**: Which endpoints require authentication
- **Schema Definitions**: All data models documented

## 🔧 Configuration

### Environment Variables

```bash
# Enable documentation in production (disabled by default)
ENABLE_API_DOCS=true

# Customize documentation URL
API_DOCS_PATH=api-docs

# CORS origins for API access
CORS_ORIGINS=http://localhost:5173,https://app.clinic.com
```

### Swagger Configuration

The documentation configuration is centralized in `src/docs/swagger-config.ts`:

- **API Information**: Title, description, version
- **Servers**: Development, staging, production
- **Authentication**: JWT Bearer token setup
- **Tags**: Organized endpoint categories
- **Examples**: Healthcare-specific examples

## 📋 Best Practices

### Documentation Standards
1. **Always add summaries** to API operations
2. **Include detailed descriptions** with use cases
3. **Provide realistic examples** for healthcare data
4. **Document all possible responses** including errors
5. **Use consistent naming** for similar operations

### Healthcare Compliance
1. **Avoid exposing PHI** in documentation examples
2. **Include security warnings** for sensitive endpoints
3. **Document audit requirements** for compliance
4. **Specify data retention policies** where relevant

### Performance Considerations
1. **Cache documentation** generation in CI/CD
2. **Minimize bundle size** for static documentation
3. **Use CDN** for external assets in production
4. **Enable compression** for large API specifications

## 🚨 Security Notes

### Development vs Production
- **Development**: Documentation enabled by default
- **Production**: Documentation disabled unless explicitly enabled
- **Staging**: Documentation available with authentication

### Sensitive Information
- **No actual patient data** in examples
- **No real API keys** or secrets
- **Generic examples** for PHI-related fields
- **Security headers** included in all responses

## 📝 Maintenance

### Regular Updates
- **Weekly**: Review endpoint documentation
- **Monthly**: Update examples and schemas
- **Quarterly**: Full documentation audit
- **Release**: Generate fresh documentation

### Version Control
- **Track changes** in API specifications
- **Maintain changelog** for breaking changes
- **Tag releases** with documentation versions
- **Archive old versions** for reference

## 🤝 Contributing

1. **Update documentation** when adding new endpoints
2. **Test documentation** generation before committing
3. **Follow healthcare terminology** (clients vs patients)
4. **Include security considerations** for new features
5. **Validate OpenAPI spec** with tools like swagger-validator

## 📞 Support

For documentation issues or improvements:
- **GitHub Issues**: Report bugs or request features
- **API Team**: Contact for complex documentation needs
- **Security Team**: Consult for PHI-related documentation
- **Compliance Team**: Review for HIPAA requirements

---

Generated on: ${new Date().toISOString()}
API Version: 2.0.0