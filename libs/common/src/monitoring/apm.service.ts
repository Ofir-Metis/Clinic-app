import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Optional APM Service that gracefully handles missing dependencies
 * This service provides APM functionality when dependencies are available
 * but continues to work when they're not installed
 */
@Injectable()
export class APMService {
  private readonly logger = new Logger(APMService.name);
  private isInitialized = false;
  private apmProvider: string;
  private serviceName: string;
  private environment: string;
  private version: string;

  constructor(private configService: ConfigService) {
    this.apmProvider = this.configService.get('APM_PROVIDER', 'none');
    this.serviceName = this.configService.get('APM_SERVICE_NAME', 'clinic-app');
    this.environment = this.configService.get('NODE_ENV', 'development');
    this.version = this.configService.get('APP_VERSION', '1.0.0');
  }

  /**
   * Initialize APM based on configured provider
   */
  initializeAPM(): void {
    if (this.isInitialized || this.apmProvider === 'none') {
      return;
    }

    this.logger.log(`Initializing APM with provider: ${this.apmProvider}`);

    switch (this.apmProvider.toLowerCase()) {
      case 'datadog':
        this.initializeDatadog();
        break;
      case 'newrelic':
        this.initializeNewRelic();
        break;
      case 'appdynamics':
        this.initializeAppDynamics();
        break;
      case 'opentelemetry':
        this.initializeOpenTelemetry();
        break;
      default:
        this.logger.warn(`Unknown APM provider: ${this.apmProvider}`);
        return;
    }

    this.isInitialized = true;
    this.logger.log('APM initialization completed');
  }

  private initializeDatadog() {
    try {
      let tracer;
      try {
        tracer = require('dd-trace');
      } catch {
        this.logger.warn('dd-trace not available - install with: npm install dd-trace');
        return;
      }
      
      tracer.init({
        service: this.serviceName,
        env: this.environment,
        version: this.version,
        logInjection: true,
        runtimeMetrics: true,
        profiling: true,
      });
      this.logger.log('Datadog APM initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Datadog APM:', error.message);
    }
  }

  private initializeNewRelic() {
    try {
      let newrelic;
      try {
        newrelic = require('newrelic');
      } catch {
        this.logger.warn('newrelic not available - install with: npm install newrelic');
        return;
      }

      // New Relic is typically configured via newrelic.js file
      this.logger.log('New Relic APM initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize New Relic APM:', error.message);
    }
  }

  private initializeAppDynamics() {
    try {
      let appdynamics;
      try {
        appdynamics = require('appdynamics');
      } catch {
        this.logger.warn('appdynamics not available - install with: npm install appdynamics');
        return;
      }

      appdynamics.profile({
        controllerHostName: this.configService.get('APPDYNAMICS_CONTROLLER_HOST'),
        controllerPort: this.configService.get('APPDYNAMICS_CONTROLLER_PORT', 443),
        accountName: this.configService.get('APPDYNAMICS_ACCOUNT_NAME'),
        accountAccessKey: this.configService.get('APPDYNAMICS_ACCESS_KEY'),
        applicationName: this.serviceName,
        tierName: this.configService.get('APPDYNAMICS_TIER_NAME', 'web-tier'),
        nodeName: this.configService.get('APPDYNAMICS_NODE_NAME', 'node-1'),
      });
      this.logger.log('AppDynamics APM initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize AppDynamics APM:', error.message);
    }
  }

  private initializeOpenTelemetry() {
    try {
      let NodeSDK, getNodeAutoInstrumentations, JaegerExporter;
      try {
        NodeSDK = require('@opentelemetry/sdk-node').NodeSDK;
        getNodeAutoInstrumentations = require('@opentelemetry/auto-instrumentations-node').getNodeAutoInstrumentations;
        JaegerExporter = require('@opentelemetry/exporter-jaeger').JaegerExporter;
      } catch {
        this.logger.warn('OpenTelemetry packages not available - install with: npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-jaeger');
        return;
      }

      const jaegerExporter = new JaegerExporter({
        endpoint: this.configService.get('JAEGER_ENDPOINT', 'http://localhost:14268/api/traces'),
      });

      const sdk = new NodeSDK({
        traceExporter: jaegerExporter,
        instrumentations: [getNodeAutoInstrumentations()],
        serviceName: this.serviceName,
        serviceVersion: this.version,
      });

      sdk.start();
      this.logger.log('OpenTelemetry APM initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize OpenTelemetry APM:', error.message);
    }
  }

  /**
   * Record a custom metric (gracefully handles missing APM)
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.isInitialized) {
      this.logger.debug(`Metric recorded (APM not initialized): ${name} = ${value}`);
      return;
    }

    try {
      switch (this.apmProvider.toLowerCase()) {
        case 'datadog':
          this.recordDatadogMetric(name, value, tags);
          break;
        case 'newrelic':
          this.recordNewRelicMetric(name, value, tags);
          break;
        default:
          this.logger.debug(`Custom metric: ${name} = ${value}`, tags);
      }
    } catch (error) {
      this.logger.warn(`Failed to record metric ${name}:`, error.message);
    }
  }

  private recordDatadogMetric(name: string, value: number, tags?: Record<string, string>): void {
    try {
      const tracer = require('dd-trace');
      const span = tracer.scope().active();
      if (span) {
        span.setTag(name, value);
        if (tags) {
          Object.entries(tags).forEach(([key, val]) => span.setTag(key, val));
        }
      }
    } catch {
      // Silently fail if dd-trace not available
    }
  }

  private recordNewRelicMetric(name: string, value: number, tags?: Record<string, string>): void {
    try {
      const newrelic = require('newrelic');
      newrelic.recordMetric(name, value);
      if (tags) {
        Object.entries(tags).forEach(([key, val]) => {
          newrelic.addCustomAttribute(key, val);
        });
      }
    } catch {
      // Silently fail if newrelic not available
    }
  }

  /**
   * Create a span for distributed tracing
   */
  createSpan(name: string, operation?: () => Promise<any>): any {
    if (!this.isInitialized) {
      // Return a no-op span if APM not initialized
      return {
        setTag: () => {},
        setError: () => {},
        finish: () => {},
      };
    }

    try {
      switch (this.apmProvider.toLowerCase()) {
        case 'datadog':
          return this.createDatadogSpan(name, operation);
        case 'newrelic':
          return this.createNewRelicSpan(name, operation);
        default:
          this.logger.debug(`Span created: ${name}`);
          return { setTag: () => {}, setError: () => {}, finish: () => {} };
      }
    } catch (error) {
      this.logger.warn(`Failed to create span ${name}:`, error.message);
      return { setTag: () => {}, setError: () => {}, finish: () => {} };
    }
  }

  private createDatadogSpan(name: string, operation?: () => Promise<any>): any {
    try {
      const tracer = require('dd-trace');
      const span = tracer.startSpan(name);
      
      if (operation) {
        return tracer.scope().activate(span, async () => {
          try {
            const result = await operation();
            span.finish();
            return result;
          } catch (error) {
            span.setTag('error', true);
            span.setTag('error.message', error.message);
            span.finish();
            throw error;
          }
        });
      }
      
      return span;
    } catch {
      return { setTag: () => {}, setError: () => {}, finish: () => {} };
    }
  }

  private createNewRelicSpan(name: string, operation?: () => Promise<any>): any {
    try {
      const newrelic = require('newrelic');
      
      if (operation) {
        return newrelic.startBackgroundTransaction(name, async () => {
          try {
            return await operation();
          } catch (error) {
            newrelic.noticeError(error);
            throw error;
          }
        });
      }
      
      return { setTag: () => {}, setError: () => {}, finish: () => {} };
    } catch {
      return { setTag: () => {}, setError: () => {}, finish: () => {} };
    }
  }

  /**
   * Record an error with APM
   */
  recordError(error: Error, context?: Record<string, any>): void {
    if (!this.isInitialized) {
      this.logger.error('Error recorded (APM not initialized):', error.message);
      return;
    }

    try {
      switch (this.apmProvider.toLowerCase()) {
        case 'datadog':
          this.recordDatadogError(error, context);
          break;
        case 'newrelic':
          this.recordNewRelicError(error, context);
          break;
        default:
          this.logger.error('APM Error:', error.message, context);
      }
    } catch (err) {
      this.logger.warn('Failed to record error with APM:', err.message);
    }
  }

  private recordDatadogError(error: Error, context?: Record<string, any>): void {
    try {
      const tracer = require('dd-trace');
      const span = tracer.scope().active();
      if (span) {
        span.setTag('error', true);
        span.setTag('error.message', error.message);
        span.setTag('error.stack', error.stack);
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            span.setTag(`error.context.${key}`, value);
          });
        }
      }
    } catch {
      // Silently fail
    }
  }

  private recordNewRelicError(error: Error, context?: Record<string, any>): void {
    try {
      const newrelic = require('newrelic');
      newrelic.noticeError(error, context);
    } catch {
      // Silently fail
    }
  }

  /**
   * Get APM status information
   */
  getStatus(): {
    initialized: boolean;
    provider: string;
    serviceName: string;
    environment: string;
    version: string;
  } {
    return {
      initialized: this.isInitialized,
      provider: this.apmProvider,
      serviceName: this.serviceName,
      environment: this.environment,
      version: this.version,
    };
  }
}