import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordUtilService {
  comparePasswords(plainPassword: string, hashedPassword: string): boolean {
    // Ensure inputs are strings to avoid runtime errors in bcrypt
    if (typeof plainPassword !== 'string' || typeof hashedPassword !== 'string') return false;
    if (!plainPassword.length || !hashedPassword.length) return false;
    try {
      return bcrypt.compareSync(plainPassword, hashedPassword);
    } catch (e) {
      // log? keep silent and return false to avoid leaking details
      return false;
    }
  }

  hashPassword(plainPassword: string): string {
    return bcrypt.hashSync(plainPassword, 10);
  }

  compareHash(plainInput: string, hashedInput: string) {
    if (!plainInput || !hashedInput) return false;
    try {
      return bcrypt.compareSync(plainInput, hashedInput);
    } catch (e) {
      return false;
    }
  }

}
