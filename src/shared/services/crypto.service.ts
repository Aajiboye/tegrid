import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  constructor(private readonly configService: ConfigService) {}

  /**
   * Normalize a provided key (hex or base64) into a 32-byte Buffer.
   * Throws if the provided key is invalid.
   */
  private normalizeKey(raw?: string): Buffer {
    let k = raw;
    if (!k) {
      k = this.configService.get<string>('NIN_ENCRYPTION_KEY');
      if (!k) {
        this.logger.error('No encryption key provided and NIN_ENCRYPTION_KEY is not set in configuration.');
        throw new Error('Missing encryption key');
      }
    }

    // Accept hex or base64 encoded 32-byte keys
    let buf: Buffer;
    if (/^[0-9a-fA-F]{64}$/.test(k)) {
      buf = Buffer.from(k, 'hex');
    } else {
      buf = Buffer.from(k, 'base64');
    }

    if (buf.length !== 32) {
      this.logger.error('Encryption key must be 32 bytes (base64 or hex-encoded)');
      throw new Error('Invalid encryption key length; expected 32 bytes');
    }
    return buf;
  }

  /**
   * Encrypts plaintext using AES-256-GCM. Optionally accepts a per-call key (hex or base64).
   * Returns a compact base64 encoded string: iv:tag:ciphertext
   */
  encrypt(plaintext: string, key?: string): string {
    const k = this.normalizeKey(key);
    const iv = crypto.randomBytes(12); // recommended IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', k, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  /**
   * Decrypts a payload previously created by encrypt(). Optionally accepts a per-call key (hex or base64).
   */
  decrypt(payload: string, key?: string): string {
    const k = this.normalizeKey(key);
    const parts = payload.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted payload');
    const iv = Buffer.from(parts[0], 'base64');
    const tag = Buffer.from(parts[1], 'base64');
    const ciphertext = Buffer.from(parts[2], 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', k, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  }
}
