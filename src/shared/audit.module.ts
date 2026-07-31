import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLog, AuditLogSchema } from './models/audit.model';
import { AuditRepository } from './repositories/audit.repo';
import { AuditService } from './services/audit.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }])],
  providers: [AuditRepository, AuditService],
  exports: [AuditService],
})
export class AuditModule {}
