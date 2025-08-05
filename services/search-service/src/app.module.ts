import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '@clinic/common';
import { SearchModule } from './search/search.module';
import { IndexingModule } from './indexing/indexing.module';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: process.env.POSTGRES_DB || 'clinic',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.POSTGRES_SSL === 'true' ? {
        rejectUnauthorized: false,
      } : false,
    }),
    CommonModule,
    ElasticsearchModule,
    SearchModule,
    IndexingModule,
    HealthModule,
  ],
})
export class AppModule {}