import { Injectable } from '@nestjs/common';
import { AdminRepository } from '../repositories/admin.repo';
import { PasswordUtilService } from '../../../shared/utils/password.util';
import { Role } from '../enums/roles.enum';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepo: AdminRepository, private readonly passwordUtil: PasswordUtilService) {}

  async createRootAdminIfNotExists(email: string, password: string) {
    const existing = await this.adminRepo.findOne({ email });
    if (existing) return existing;

    const hashed = this.passwordUtil.hashPassword(password);
    const admin = {
      email,
      password: hashed,
      role: Role.Root,
      isActive: true,
    } as any;
    return this.adminRepo.save(admin);
  }

  // placeholder for invite flow
  async inviteAdmin(inviterId: string, email: string) {
    // Implementation can create a pending admin invite, send email etc.
    return { invited: true, email, inviterId };
  }

  async login(email: string, password: string) {
    const admin = await this.adminRepo.findOne({ email });
    if (!admin) return null;
    const ok = this.passwordUtil.comparePasswords(password, (admin as any).password);
    if (!ok) return null;
    // remove password before returning
    const { password: _p, ...rest } = admin as any;
    return rest;
  }
}
