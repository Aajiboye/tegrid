import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  BadRequestException,
  Logger,
} from '@nestjs/common';

import { Request, Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private logger: Logger;
  constructor() {
    this.logger = new Logger(ValidationExceptionFilter.name);
  }

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const errorCode = exception.getStatus();

    const errors = exception.getResponse() as { message: string[] };

    this.logger.warn(
      `${request.method} ${request.url}`,
      JSON.stringify({
        code: errorCode,
        path: request.url,
        responseMessage: errors.message,
        type: 'Request Validation Error',
      }),
      JSON.stringify(exception.stack),
    );

    return response.status(errorCode).json({
      status: false,
      code: errorCode,
      path: request.url,
      method: request.method,
      error: errors.message,
    });
  }
}
