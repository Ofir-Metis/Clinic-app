"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthcareExamples = exports.SwaggerSchemas = exports.SwaggerConfig = void 0;
const swagger_1 = require("@nestjs/swagger");
/**
 * Comprehensive Swagger configuration for Clinic Management API
 * Healthcare-grade API documentation with security and compliance features
 */
class SwaggerConfig {
    static createConfig() {
        return new swagger_1.DocumentBuilder()
            .setTitle('Clinic Management Platform API')
            .setDescription(`
        ## Healthcare-Grade Clinic Management Platform

        This API provides comprehensive healthcare management capabilities including:
        
        ### 🏥 Core Features
        - **Patient Management**: Complete patient lifecycle management
        - **Appointment Scheduling**: Advanced booking and calendar integration
        - **Session Recording**: AI-powered session analysis and transcription
        - **Coach Discovery**: Find and connect with specialized coaches
        - **Growth Tracking**: Client progress monitoring and achievements

        ### 🔒 Security & Compliance
        - **HIPAA Compliant**: Full healthcare data protection
        - **Multi-Factor Authentication**: Enhanced security for sensitive operations
        - **Role-Based Access Control**: Granular permission management
        - **Audit Logging**: Complete activity tracking for compliance
        - **Data Encryption**: AES-256 encryption at rest and in transit

        ### 🚨 Disaster Recovery
        - **Automated Backups**: Regular encrypted backups with 7-year retention
        - **Business Continuity**: Comprehensive disaster recovery procedures
        - **Health Monitoring**: Real-time system health and performance tracking

        ### 📊 Analytics & Reporting
        - **Performance Metrics**: Detailed system and user analytics
        - **Compliance Reports**: Automated compliance monitoring and reporting
        - **Custom Dashboards**: Personalized views for different user roles

        ### 🔧 Technical Features
        - **Microservices Architecture**: Scalable, maintainable service design
        - **Real-time Communication**: WebSocket support for live updates
        - **API Rate Limiting**: DDoS protection and fair usage policies
        - **Caching Strategy**: Optimized performance with Redis caching

        ---

        ### Authentication
        All endpoints require JWT authentication. Include your token in the Authorization header:
        \`\`\`
        Authorization: Bearer <your-jwt-token>
        \`\`\`

        ### Rate Limiting
        - **Strict Endpoints**: 5 requests per 15 minutes (MFA, sensitive operations)
        - **Moderate Endpoints**: 30 requests per minute (API operations)
        - **Lenient Endpoints**: 100 requests per minute (read operations)
        - **Default**: 60 requests per minute

        ### Error Handling  
        All endpoints return standardized error responses:
        \`\`\`json
        {
          "statusCode": 400,
          "message": "Validation failed",
          "error": "Bad Request",
          "timestamp": "2024-01-01T00:00:00.000Z",
          "path": "/api/endpoint"
        }
        \`\`\`

        ### Health Checks
        - **Health**: \`GET /health\` - Overall system health
        - **Liveness**: \`GET /health/liveness\` - Service availability
        - **Readiness**: \`GET /health/readiness\` - Service readiness

        For support, contact: support@clinicapp.com
      `)
            .setVersion('2.0.0')
            .setContact('Clinic Support Team', 'https://clinicapp.com/support', 'support@clinicapp.com')
            .setLicense('Proprietary', 'https://clinicapp.com/license')
            .setTermsOfService('https://clinicapp.com/terms')
            .addServer('http://localhost:4000', 'Development Server')
            .addServer('https://api-staging.clinicapp.com', 'Staging Server')
            .addServer('https://api.clinicapp.com', 'Production Server')
            .addBearerAuth({
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'JWT Token',
            description: 'Enter your JWT token obtained from the authentication endpoint',
            in: 'header',
        }, 'JWT-auth')
            .addSecurityRequirements('JWT-auth')
            .addTag('Authentication', 'User authentication and session management')
            .addTag('Dashboard', 'Dashboard data and analytics')
            .addTag('Health', 'System health and monitoring')
            .addTag('Patients', 'Patient management and medical records')
            .addTag('Appointments', 'Appointment scheduling and management')
            .addTag('Coachs', 'Coach/coach profiles and discovery')
            .addTag('Recordings', 'Session recordings and AI analysis')
            .addTag('Google Integration', 'Google Calendar and Gmail integration')
            .addTag('Onboarding', 'User onboarding and setup')
            .addTag('Programs', 'Treatment programs and protocols')
            .addTag('AI Services', 'AI-powered features and analysis')
            .addTag('Analytics', 'Reporting and analytics')
            .addTag('Admin', 'Administrative functions and system management')
            .addTag('View Switching', 'Role-based view switching and impersonation')
            .addTag('Security', 'Security management and monitoring')
            .addTag('Backup', 'Data backup and restore operations')
            .addTag('Configuration', 'System configuration management')
            .addTag('Performance', 'Performance monitoring and optimization')
            .addTag('API Management', 'API key and access management')
            .addTag('Compliance', 'HIPAA compliance and audit trails')
            .addTag('Encryption', 'Data encryption and key management')
            .addTag('Disaster Recovery', 'Disaster recovery and business continuity')
            .addTag('Examples', 'Example implementations and demonstrations')
            .build();
    }
    static createOptions() {
        return {
            operationIdFactory: (controllerKey, methodKey) => methodKey,
            deepScanRoutes: true,
            ignoreGlobalPrefix: false,
            extraModels: [],
        };
    }
    static getCustomOptions() {
        return {
            explorer: true,
            swaggerOptions: {
                persistAuthorization: true,
                displayRequestDuration: true,
                docExpansion: 'none',
                filter: true,
                showRequestHeaders: true,
                tryItOutEnabled: true,
                supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
                validatorUrl: null,
                layout: 'BaseLayout',
                deepLinking: true,
                displayOperationId: false,
                defaultModelsExpandDepth: 1,
                defaultModelExpandDepth: 1,
                defaultModelRendering: 'example',
                showExtensions: true,
                showCommonExtensions: true,
                useUnsafeMarkdown: false,
            },
            customSiteTitle: 'Clinic Management API Documentation',
            customfavIcon: '/favicon.ico',
            customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info hgroup.main .title { color: #2E7D6B; }
        .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; border-radius: 4px; }
        .swagger-ui .opblock.opblock-post { border-color: #2E7D6B; }
        .swagger-ui .opblock.opblock-post .opblock-summary { border-color: #2E7D6B; }
        .swagger-ui .btn.authorize { background-color: #2E7D6B; border-color: #2E7D6B; }
        .swagger-ui .btn.authorize:hover { background-color: #245A4E; }
        .swagger-ui .info .title small { color: #666; }
        .swagger-ui .info .description { margin: 20px 0; }
        .swagger-ui .info .description p { margin: 10px 0; }
        .swagger-ui .info .description h3 { color: #2E7D6B; margin-top: 25px; }
        .swagger-ui .info .description ul { margin: 10px 0; padding-left: 20px; }
        .swagger-ui .info .description code { background: #f5f5f5; padding: 2px 4px; }
        .swagger-ui .auth-container .auth-btn-wrapper { margin-bottom: 10px; }
        .swagger-ui .response-col_status { font-weight: bold; }
        .swagger-ui .response.highlighted { background: rgba(46, 125, 107, 0.1); }
      `,
            customJs: `
        window.addEventListener('load', function() {
          // Auto-focus on the Authorize button for better UX
          const authorizeBtn = document.querySelector('.btn.authorize');
          if (authorizeBtn) {
            authorizeBtn.style.fontSize = '14px';
            authorizeBtn.style.fontWeight = 'bold';
          }
          
          // Add custom health check notice
          const info = document.querySelector('.info');
          if (info) {
            const healthNotice = document.createElement('div');
            healthNotice.innerHTML = '<div style="background: #e8f5e8; border: 1px solid #2E7D6B; padding: 15px; border-radius: 4px; margin: 20px 0;"><strong>🏥 Healthcare Notice:</strong> This API handles Protected Health Information (PHI). Ensure compliance with HIPAA regulations when using these endpoints. All requests are logged for audit purposes.</div>';
            info.appendChild(healthNotice);
          }
        });
      `,
        };
    }
}
exports.SwaggerConfig = SwaggerConfig;
/**
 * Common Swagger decorators and schemas for healthcare applications
 */
class SwaggerSchemas {
}
exports.SwaggerSchemas = SwaggerSchemas;
SwaggerSchemas.StandardResponse = {
    type: 'object',
    properties: {
        status: { type: 'string', example: 'success' },
        data: { type: 'object' },
        message: { type: 'string', example: 'Operation completed successfully' },
        timestamp: { type: 'string', format: 'date-time' }
    }
};
SwaggerSchemas.ErrorResponse = {
    type: 'object',
    properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Validation failed' },
        error: { type: 'string', example: 'Bad Request' },
        timestamp: { type: 'string', format: 'date-time' },
        path: { type: 'string', example: '/api/endpoint' }
    }
};
SwaggerSchemas.HealthResponse = {
    type: 'object',
    properties: {
        status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
        timestamp: { type: 'string', format: 'date-time' },
        version: { type: 'string', example: '2.0.0' },
        services: {
            type: 'object',
            properties: {
                database: { $ref: '#/components/schemas/ServiceHealth' },
                redis: { $ref: '#/components/schemas/ServiceHealth' },
                filesystem: { $ref: '#/components/schemas/ServiceHealth' }
            }
        },
        uptime: { type: 'number', example: 123456 },
        memory: {
            type: 'object',
            properties: {
                used: { type: 'number', example: 128 },
                total: { type: 'number', example: 512 },
                usage: { type: 'string', example: '25%' }
            }
        }
    }
};
SwaggerSchemas.ServiceHealth = {
    type: 'object',
    properties: {
        status: { type: 'string', enum: ['healthy', 'unhealthy'] },
        responseTime: { type: 'number', example: 15 },
        error: { type: 'string' },
        lastCheck: { type: 'string', format: 'date-time' }
    }
};
SwaggerSchemas.PaginationResponse = {
    type: 'object',
    properties: {
        data: { type: 'array', items: {} },
        pagination: {
            type: 'object',
            properties: {
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 20 },
                total: { type: 'number', example: 100 },
                pages: { type: 'number', example: 5 }
            }
        }
    }
};
/**
 * Healthcare-specific response examples
 */
class HealthcareExamples {
}
exports.HealthcareExamples = HealthcareExamples;
HealthcareExamples.PatientExample = {
    id: 'pat_123456789',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-15',
    email: 'john.doe@email.com',
    phone: '+1-555-0123',
    address: '123 Main St, Anytown, ST 12345',
    emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '+1-555-0124'
    },
    medicalHistory: '[REDACTED - PHI]',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z'
};
HealthcareExamples.AppointmentExample = {
    id: 'apt_987654321',
    patientId: 'pat_123456789',
    coachId: 'thr_456789123',
    scheduledAt: '2024-02-01T15:00:00Z',
    duration: 60,
    type: 'individual_therapy',
    status: 'scheduled',
    notes: 'Follow-up session for anxiety management',
    location: 'Room 201',
    createdAt: '2024-01-20T09:00:00Z'
};
HealthcareExamples.CoachExample = {
    id: 'thr_456789123',
    firstName: 'Dr. Sarah',
    lastName: 'Johnson',
    title: 'Clinical Psychologist',
    specializations: ['Anxiety Disorders', 'Cognitive Behavioral Therapy', 'Trauma'],
    licenseNumber: 'PSY12345',
    email: 'sarah.johnson@clinic.com',
    phone: '+1-555-0125',
    bio: 'Dr. Johnson has over 10 years of experience in clinical psychology...',
    availability: {
        monday: ['09:00-17:00'],
        tuesday: ['09:00-17:00'],
        wednesday: ['10:00-18:00'],
        thursday: ['09:00-17:00'],
        friday: ['09:00-15:00']
    },
    rating: 4.8,
    reviewCount: 127,
    isActive: true,
    joinedAt: '2022-03-15T00:00:00Z'
};
