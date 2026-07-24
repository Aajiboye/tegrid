
import { Injectable } from '@nestjs/common';

@Injectable()
export class PhoneUtilService {

  /**
   * Normalize a phone number by removing common separators (spaces, dashes, parentheses)
   * and leaving digits and a leading + if present.
   */
  normalizePhone(phone: string): string {
    if (!phone) return '';
    // keep digits and leading +
    const s = String(phone).trim();
    const leadingPlus = s.startsWith('+') ? '+' : '';
    const digits = s.replace(/[^0-9]/g, '');
    return leadingPlus + digits;
  }
}
