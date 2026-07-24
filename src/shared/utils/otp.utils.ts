import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class OTPUtilService {

  generateOTP(mock: boolean = false, ttl = 15, length: number = 6): { otp: string; expirationTime: Date } {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    const otp = mock ? '123456' : Math.floor(min + Math.random() * (max - min + 1)).toString();
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + ttl);
    return {
      otp,
      expirationTime,
    };
  }
}
