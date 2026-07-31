import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, AdminSchema } from './models/admin.model';
import { AdminRepository } from './repositories/admin.repo';
import { AdminService } from './services/admin.service';
import { PasswordUtilService } from 'src/shared/utils/password.util';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { TokenService } from 'src/shared/services/token.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }])],
  providers: [AdminRepository, AdminService, PasswordUtilService, TokenService],
  controllers: [AdminAuthController],
  exports: [AdminService],
})
export class AdminModule {}
