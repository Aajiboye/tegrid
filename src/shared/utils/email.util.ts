
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailUtilService {

  /**
   * Normalize an email address for consistent storage and lookups.
   * - trims whitespace
   * - converts to lower-case
   */
  normalizeEmail(email: string): string {
    if (!email) return '';
    return String(email).trim().toLowerCase();
  }
}
