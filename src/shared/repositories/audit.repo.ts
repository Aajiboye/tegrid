import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from '../models/audit.model';

@Injectable()
export class AuditRepository {
  constructor(@InjectModel(AuditLog.name) private readonly model: Model<AuditLog>) {}

  async save(entry: Partial<AuditLog>) {
    const m = new this.model(entry);
    return m.save();
  }
}
