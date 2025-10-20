import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter formatting error responses.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    // Log the actual error for debugging
    this.logger.error(`Exception in ${request.method} ${request.url}:`, exception instanceof Error ? exception.stack : exception);

    response.status(status).json({
      statusCode: status,
      path: request.url,
      message,
    });
  }
}
