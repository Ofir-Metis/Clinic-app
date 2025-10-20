/**
 * Proxy Service - Enterprise-grade request forwarding service
 * Handles HTTP request proxying to backend microservices
 */

import { Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { CentralizedLoggerService } from '@clinic/common';
import * as http from 'http';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(private readonly centralizedLogger: CentralizedLoggerService) {}

  async forwardRequest(
    serviceName: string,
    port: number,
    req: Request,
    res: Response
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Remove the service prefix from the path
      const servicePrefix = this.getServicePrefix(serviceName);
      const targetPath = req.path.replace(new RegExp(`^/api/v1/${servicePrefix}`), `/${servicePrefix}`);
      
      const options: http.RequestOptions = {
        hostname: 'localhost',
        port: port,
        path: targetPath || '/',
        method: req.method,
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/json',
          'Accept': req.headers.accept || 'application/json',
          'Authorization': req.headers.authorization || '',
          'User-Agent': req.headers['user-agent'] || 'api-gateway-proxy',
        },
        timeout: 10000
      };

      const proxyReq = http.request(options, (proxyRes) => {
        // Forward status code
        res.statusCode = proxyRes.statusCode || 200;
        
        // Forward headers
        Object.entries(proxyRes.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });

        // Pipe response
        proxyRes.pipe(res);
        
        this.centralizedLogger.log(`Proxy response from ${serviceName}`, ProxyService.name);
        resolve();
      });

      proxyReq.on('error', (err) => {
        this.centralizedLogger.error(`Proxy error to ${serviceName}:${port}`, err.stack, ProxyService.name);
        if (!res.headersSent) {
          res.status(503).json({ error: `Service ${serviceName} unavailable` });
        }
        reject(err);
      });

      proxyReq.on('timeout', () => {
        const err = new Error(`Proxy timeout to ${serviceName}:${port}`);
        this.centralizedLogger.error(`Proxy timeout to ${serviceName}:${port}`, err.stack, ProxyService.name);
        if (!res.headersSent) {
          res.status(504).json({ error: `Service ${serviceName} timeout` });
        }
        reject(err);
      });

      // Forward request body for POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
        if (req.body && typeof req.body === 'object') {
          const body = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Length', Buffer.byteLength(body));
          proxyReq.write(body);
          proxyReq.end();
        } else {
          req.pipe(proxyReq);
        }
      } else {
        proxyReq.end();
      }
    });
  }

  private getServicePrefix(serviceName: string): string {
    const prefixMap: Record<string, string> = {
      'auth-service': 'auth',
      'appointments-service': 'appointments',
      'files-service': 'files',
      'notifications-service': 'notifications',
      'ai-service': 'ai',
      'notes-service': 'notes',
      'analytics-service': 'analytics',
      'settings-service': 'settings',
      'billing-service': 'billing'
    };
    
    return prefixMap[serviceName] || serviceName;
  }

  /**
   * Health check for backend service
   */
  async checkServiceHealth(serviceName: string, port: number): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:${port}/health`);
      return response.ok;
    } catch (error) {
      this.centralizedLogger.warn(`Service ${serviceName} health check failed`, ProxyService.name);
      return false;
    }
  }
}