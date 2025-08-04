import { Controller, Post, Body, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  PayloadValidation, 
  ValidatedPayload, 
  ValidatedFileUpload, 
  PayloadSizeGuard,
  SafeUserInputDto 
} from '@clinic/common';

/**
 * Example controller demonstrating secure payload handling
 */
@Controller('secure')
@UseGuards(PayloadSizeGuard)
export class SecurePayloadController {

  /**
   * Create user with validated payload and size limits
   */
  @Post('users')
  @PayloadValidation({
    maxSize: 1024 * 1024, // 1MB limit for user creation
    allowedFields: ['name', 'email', 'description', 'tags'],
    requiredFields: ['name', 'email'],
    maxDepth: 3,
    maxArrayLength: 50,
    sanitize: true
  })
  async createUser(@ValidatedPayload() userData: SafeUserInputDto) {
    // The payload has been automatically validated and sanitized
    return {
      success: true,
      message: 'User created successfully',
      data: userData
    };
  }

  /**
   * Upload file with size and type validation
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @ValidatedFileUpload({
      maxSize: 500 * 1024 * 1024, // 500MB
      allowedTypes: [
        'image/jpeg', 'image/png', 'image/gif',
        'video/mp4', 'video/mov', 'video/avi',
        'audio/mp3', 'audio/wav', 'audio/m4a',
        'application/pdf'
      ]
    }) file: any,
    @ValidatedPayload({
      maxSize: 10 * 1024, // 10KB metadata
      allowedFields: ['title', 'description', 'tags'],
      sanitize: true
    }) metadata?: any
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    return {
      success: true,
      message: 'File uploaded successfully',
      file: {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      },
      metadata
    };
  }

  /**
   * Bulk operation with strict array limits
   */
  @Post('bulk-create')
  @PayloadValidation({
    maxSize: 5 * 1024 * 1024, // 5MB for bulk operations
    maxArrayLength: 100, // Max 100 items in bulk
    maxDepth: 4,
    sanitize: true
  })
  async bulkCreate(@ValidatedPayload() bulkData: { items: SafeUserInputDto[] }) {
    // Validate that items is an array and not too large
    if (!Array.isArray(bulkData.items)) {
      throw new Error('Items must be an array');
    }

    if (bulkData.items.length > 100) {
      throw new Error('Too many items in bulk operation (max 100)');
    }

    return {
      success: true,
      message: `Bulk operation completed for ${bulkData.items.length} items`,
      processedCount: bulkData.items.length
    };
  }

  /**
   * Complex nested data with depth limits
   */
  @Post('complex-data')
  @PayloadValidation({
    maxSize: 2 * 1024 * 1024, // 2MB
    maxDepth: 5, // Allow deeper nesting for complex data
    maxArrayLength: 200,
    sanitize: true
  })
  async processComplexData(@ValidatedPayload() complexData: any) {
    return {
      success: true,
      message: 'Complex data processed successfully',
      dataStructure: this.analyzeDataStructure(complexData)
    };
  }

  /**
   * Session notes with rich text content
   */
  @Post('session-notes')
  @PayloadValidation({
    maxSize: 500 * 1024, // 500KB for rich text
    allowedFields: ['title', 'content', 'tags', 'sessionId', 'clientId'],
    requiredFields: ['title', 'content', 'sessionId'],
    maxDepth: 3,
    sanitize: true // Important for rich text content
  })
  async createSessionNote(@ValidatedPayload() noteData: {
    title: string;
    content: string;
    tags?: string[];
    sessionId: string;
    clientId: string;
  }) {
    return {
      success: true,
      message: 'Session note created successfully',
      note: {
        id: 'generated-id',
        ...noteData,
        createdAt: new Date().toISOString()
      }
    };
  }

  /**
   * Public API endpoint with strict limits
   */
  @Post('public/feedback')
  @PayloadValidation({
    maxSize: 50 * 1024, // 50KB for public endpoints
    allowedFields: ['message', 'email', 'category'],
    requiredFields: ['message'],
    maxDepth: 2, // Simple structure only
    maxArrayLength: 10,
    sanitize: true
  })
  async submitFeedback(@ValidatedPayload() feedback: {
    message: string;
    email?: string;
    category?: string;
  }) {
    return {
      success: true,
      message: 'Feedback submitted successfully',
      id: 'feedback-' + Date.now()
    };
  }

  /**
   * Helper method to analyze data structure
   */
  private analyzeDataStructure(data: any): any {
    const getType = (value: any): string => {
      if (value === null) return 'null';
      if (Array.isArray(value)) return 'array';
      return typeof value;
    };

    const analyze = (obj: any, depth = 0): any => {
      if (depth > 10) return 'max_depth_reached';
      
      const type = getType(obj);
      
      if (type === 'array') {
        return {
          type: 'array',
          length: obj.length,
          elementTypes: obj.slice(0, 3).map((item: any) => analyze(item, depth + 1))
        };
      }
      
      if (type === 'object') {
        const structure = {};
        const keys = Object.keys(obj).slice(0, 10); // Limit analysis
        
        keys.forEach(key => {
          structure[key] = analyze(obj[key], depth + 1);
        });
        
        return {
          type: 'object',
          keys: Object.keys(obj).length,
          structure
        };
      }
      
      return { type, length: typeof obj === 'string' ? obj.length : undefined };
    };

    return analyze(data);
  }
}

/**
 * Security Features Demonstrated:
 * 
 * ✅ Payload Size Limits - Different limits for different endpoints
 * ✅ Content Type Validation - File type restrictions
 * ✅ Structure Validation - Depth and array length limits
 * ✅ Field Whitelisting - Only allowed fields accepted
 * ✅ Required Field Validation - Ensure critical fields are present
 * ✅ Automatic Sanitization - Clean dangerous content
 * ✅ File Upload Security - Size and type validation
 * ✅ Bulk Operation Limits - Prevent resource exhaustion
 * ✅ Public Endpoint Restrictions - Stricter limits for public APIs
 * ✅ Rich Text Handling - Safe processing of user content
 */