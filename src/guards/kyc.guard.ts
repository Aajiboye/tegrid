import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { HomeOwnerKycService } from 'src/domain/identity/services/home-owner-kyc.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class KycGuard implements CanActivate {
  constructor(private readonly kycService: HomeOwnerKycService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user || !user._id) return false;

    // get composite status
    const status = await this.kycService.getKycStatus(user);
    const allCompleted = status.profileCompleted && status.identityCompleted && status.addressVerificationCompleted;
    if (!allCompleted) {
      throw new ForbiddenException('Complete KYC (profile, identity and address) before creating job requests');
    }

    return true;
  }
}
