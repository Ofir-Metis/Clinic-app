#!/bin/bash

# Create missing services for client-relationships-service
mkdir -p services/client-relationships-service/src/controllers
mkdir -p services/client-relationships-service/src/services
mkdir -p services/client-relationships-service/src/health

# Create missing services
cat > services/client-relationships-service/src/services/coach.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';

@Injectable()
export class CoachService {
  findAll() {
    return [];
  }

  findOne(id: string) {
    return { id };
  }
}
EOF

# Create remaining controllers and services quickly
for service in permission goal achievement; do
  cat > services/client-relationships-service/src/services/${service}.service.ts << EOF
import { Injectable } from '@nestjs/common';

@Injectable()
export class ${service^}Service {
  findAll() {
    return [];
  }

  findOne(id: string) {
    return { id };
  }
}
EOF

  cat > services/client-relationships-service/src/controllers/${service}.controller.ts << EOF
import { Controller, Get, Param } from '@nestjs/common';
import { ${service^}Service } from '../services/${service}.service';

@Controller('${service}s')
export class ${service^}Controller {
  constructor(private readonly ${service}Service: ${service^}Service) {}

  @Get()
  findAll() {
    return { message: 'Get all ${service}s' };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return { message: \`Get ${service} \${id}\` };
  }
}
EOF
done

# Now create progress-service files
mkdir -p services/progress-service/src/health
mkdir -p services/progress-service/src/progress

cat > services/progress-service/Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Copy shared library
COPY libs ./libs

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy service source
COPY services/progress-service ./services/progress-service

# Build shared library first
RUN yarn workspace @clinic/common build

# Build the service
RUN yarn workspace @clinic/progress-service build

# Expose port
EXPOSE 3015

# Start the service
CMD ["yarn", "workspace", "@clinic/progress-service", "start:prod"]
EOF

cat > services/progress-service/package.json << 'EOF'
{
  "name": "@clinic/progress-service",
  "version": "1.0.0",
  "description": "Progress tracking and goal management service",
  "main": "dist/main.js",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/microservices": "^10.0.0",
    "nats": "^2.15.1",
    "typeorm": "^0.3.17",
    "pg": "^8.11.0",
    "@clinic/common": "*",
    "reflect-metadata": "^0.1.13"
  }
}
EOF

cat > services/progress-service/src/main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3015;
  await app.listen(port);
  console.log(`Progress Service is running on port ${port}`);
}
bootstrap();
EOF

cat > services/progress-service/src/app.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ProgressService } from './progress/progress.service';
import { ProgressController } from './progress/progress.controller';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT) || 5432,
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: process.env.POSTGRES_DB || 'clinic',
      entities: [],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
  ],
  controllers: [ProgressController, HealthController],
  providers: [ProgressService],
})
export class AppModule {}
EOF

cat > services/progress-service/src/health/health.controller.ts << 'EOF'
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'progress-service',
      timestamp: new Date().toISOString(),
    };
  }
}
EOF

echo "Missing files created successfully!"