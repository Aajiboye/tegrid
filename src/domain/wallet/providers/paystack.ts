import {
    BadRequestException,
    Injectable,
} from '@nestjs/common';
import { IWalletProvider } from '../interfaces/wallet.providers.interface';
import { AccountDto, BanksDto } from '../dtos/wallet.dto';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class PaystackWalletProvider implements IWalletProvider {
    private readonly paystackSecret: string;
    constructor(
        private readonly config: ConfigService,

    ) {
        this.paystackSecret = this.config.get<string>('PAYSTACK_SECRET');
    }


    async resolveAccountName(accountNumber: string, bankCode: string, mock: boolean): Promise<AccountDto> {
        if (mock) {
            return {
                accountName: 'John Doe',
                accountNumber: accountNumber,
                bankCode: 'Mock Bank',
            };
        }

        // Example implementation (pseudo-code):
try {
        const response = await axios.get(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
            headers: {
                Authorization: `Bearer ${this.paystackSecret}`,
            },
        });
        if (response.data.status) {
            const accountData = response.data.data;
            return {
                accountName: accountData.account_name,
                accountNumber: accountData.account_number,
                bankCode: accountData.bank_id,
            };
        } else {
            throw new BadRequestException('Unable to resolve account name');
        }

    } catch (error) {
        console.error('Error resolving account name:', error.response?.data || error.message);
        throw new BadRequestException('Error resolving account name');  

    }
}

    listBanks(): Promise<BanksDto[]> {
        const response = axios.get('https://api.paystack.co/bank', {
            headers: {
                Authorization: `Bearer ${this.paystackSecret}`,
            },
        });
        const bankList = response.then(res => res.data.data.map((bank: any) => ({
            name: bank.name,
            code: bank.code,
            slug: bank.slug,
            country: bank.country,
            currency: bank.currency,
            type: bank.type,
        })));
       return bankList;
    }
}
