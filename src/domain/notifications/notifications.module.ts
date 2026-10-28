import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PushModule } from '../../shared/push/push.module';
import { Notification, NotificationSchema } from './models/notification.model';
import { DeviceToken, DeviceTokenSchema } from './models/device-token.model';
import { NotificationRepository } from './repositories/notification.repo';
import { DeviceTokenRepository } from './repositories/device-token.repo';
import { NotificationService } from './services/notification.service';
import { NotificationController } from './controllers/notification.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: DeviceToken.name, schema: DeviceTokenSchema },
    ]),
    PushModule,
  ],
  providers: [NotificationRepository, DeviceTokenRepository, NotificationService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationsModule {}
