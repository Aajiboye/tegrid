import {
    Injectable,
    Logger,
} from '@nestjs/common';
import { IWalletProvider } from '../interfaces/wallet.providers.interface';
import { PaystackWalletProvider } from '../providers/paystack';
import { BankListRepository } from '../repositories/bank-list.repo';


@Injectable()
export class WalletService {
      private readonly logger = new Logger(WalletService.name);
    
    constructor(
        private readonly walletProvider: PaystackWalletProvider,
        private readonly bankListRepository: BankListRepository,

    ) {
    }
    async resolveAccountName(accountNumber: string, bankCode: string, mock: boolean): Promise<any> {
        return this.walletProvider.resolveAccountName(accountNumber, bankCode, mock);
    }

    async listBanks(refresh: boolean): Promise<any> {
        const banks = await this.bankListRepository.findAll();
        if (banks.length === 0 || refresh) {
            this.logger.log('Fetching banks from provider...');
            const providerBanks = await this.walletProvider.listBanks();
            await this.bankListRepository.deleteMany({});
            await this.bankListRepository.insertMany(providerBanks);
            return this.bankListRepository.findAll();
        } 
        return banks;
    }
}
