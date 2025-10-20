import { LoggingInterceptor } from '@clinic/common';
import { AllExceptionsFilter } from '@clinic/common';
import { LoggingMiddleware } from '@clinic/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for all origins during development
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
  });
  
  // Temporary: Disable problematic middleware
  // app.useGlobalInterceptors(new LoggingInterceptor({} as any));
  // app.useGlobalFilters(new AllExceptionsFilter()); // Temporarily disabled
  // app.use(new LoggingMiddleware({} as any).use);
  
  const port = process.env.PORT || 3000;
  console.log(`Files service starting on port ${port}`);
  console.log(`Attempting to bind to 0.0.0.0:${port}`);
  
  try {
    await app.listen(port, '0.0.0.0');
    console.log(`✅ Files service successfully started on port ${port}`);
    console.log(`✅ Health endpoint available at: http://0.0.0.0:${port}/health`);
    console.log(`✅ Server is listening and ready to accept connections`);
    
    // Test internal health endpoint
    setTimeout(async () => {
      try {
        const response = await fetch(`http://localhost:${port}/health`);
        const data = await response.text();
        console.log(`✅ Internal health check successful: ${data}`);
      } catch (err) {
        console.error(`❌ Internal health check failed:`, err);
      }
    }, 2000);
  } catch (error) {
    console.error(`❌ Failed to start Files service:`, error);
    process.exit(1);
  }
}
bootstrap();
