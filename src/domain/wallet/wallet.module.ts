import { Module, OnModuleInit } from '@nestjs/common';
import { WalletService } from './services/wallet.service';
import { PaystackWalletProvider } from './providers/paystack';
import { SharedModule } from 'src/shared/shared.module';
import { BankListRepository } from './repositories/bank-list.repo';
import { BankList, BankListSchema } from './models/bank-list.model';
import { MongooseModule } from '@nestjs/mongoose';
import { BankController } from './controllers/banks.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: BankList.name, schema: BankListSchema },

        ]),
    ],
    providers: [WalletService, PaystackWalletProvider, BankListRepository],
    controllers: [BankController],
    exports: [WalletService],
})

export class WalletModule { }
