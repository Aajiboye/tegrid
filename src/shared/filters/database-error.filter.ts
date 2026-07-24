import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { DatabaseErrorCodes, ErrorMessages } from '../enums';

export class DatabaseExceptFilter extends HttpException {
  private readonly logger: Logger;
  constructor(error: any) {
    const message: string =
      error.code === DatabaseErrorCodes.DUPLICATE_ERROR
        ? ErrorMessages.DUPLICATE_RECORD
        : ErrorMessages.DATABASE_ERROR;

    super(
      {
        type: ErrorMessages.DATABASE_ERROR_CODE,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error,
        message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );

    this.logger = new Logger(DatabaseExceptFilter.name);
    this.logger.error(error);
  }
}
