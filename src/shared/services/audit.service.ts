import { Injectable } from '@nestjs/common';
import { AuditRepository } from '../repositories/audit.repo';

@Injectable()
export class AuditService {
  constructor(private readonly repo: AuditRepository) {}

  async log(action: string, actor?: any, payload?: any, metadata?: any) {
    return this.repo.save({ action, actor, payload, metadata });
  }
}
