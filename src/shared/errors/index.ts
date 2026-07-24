import { HttpException, HttpStatus } from '@nestjs/common';

export class DuplicateUserError extends HttpException {
  constructor(message: string, status?: HttpStatus) {
    super(message, status || HttpStatus.CONFLICT);
  }
}
