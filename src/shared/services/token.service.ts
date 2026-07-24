import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ErrorMessages } from '../enums';

@Injectable()
export class TokenService {
  private logger = Logger;
  private readonly accessTokenDuration: string;
  private readonly refreshTokenDuration: string;
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenDuration =
      this.configService.getOrThrow<string>('JWT_EXPIRES_IN');

    this.refreshTokenDuration =
      this.configService.getOrThrow<string>('JWT_EXPIRES_IN') || '1hr';
  }

  generateAccessToken(payload: Record<string, any>): string {
    const options = { expiresIn: this.accessTokenDuration } as any;
    return (this.jwtService.sign as any)(payload as any, options);
  }

  generateRefreshToken(payload: Record<string, any>): string {
    const options = { expiresIn: this.refreshTokenDuration } as any;
    return (this.jwtService.sign as any)(payload as any, options);
  }

  verifyToken(token: string): Record<string, any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException(ErrorMessages.EXPIRED_TOKEN);
    }
  }
}
