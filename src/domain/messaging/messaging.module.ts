import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './models/message.model';
import { HomeOwner, HomeOwnerSchema } from '../identity/models/home-owner-user.model';
import { TradePerson, TradePersonSchema } from '../identity/models/trade-person-user.model';
import { MessageRepository } from './repositories/message.repo';
import { MessagingService } from './services/messaging.service';
import { MessagingController } from './controllers/messaging.controller';
import { MessagingGateway } from './gateways/messaging.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: HomeOwner.name, schema: HomeOwnerSchema },
      { name: TradePerson.name, schema: TradePersonSchema },
    ]),
  ],
  providers: [MessageRepository, MessagingService, MessagingGateway],
  controllers: [MessagingController],
  exports: [MessagingService],
})
export class MessagingModule {}
