import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { Request, Response } from 'express';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private logger: Logger;
  constructor() {
    this.logger = new Logger(HttpErrorFilter.name);
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const errorCode = HttpErrorFilter.errorCodeFallBack(exception);
    // const errorCode = exception.getStatus()
    //   ? exception.getStatus()
    //   : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = {
      success: false,
      error: {
        status: false,
        code: errorCode,
        path: request.url,
        method: request.method,
        message: exception.message,
      },
    };

    this.logger.error(
      `${request.method} ${request.url}`,
      JSON.stringify(errorResponse),
      JSON.stringify(exception.stack),
    );

    return response.status(errorCode).json(errorResponse);
  }

  static errorCodeFallBack(exception: HttpException) {
    try {
      return exception.getStatus();
    } catch (error) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}
