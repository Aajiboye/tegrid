import {
    BadRequestException,
    Injectable,
    Logger,
} from '@nestjs/common';
import { IWalletProvider } from '../interfaces/wallet.providers.interface';
import { AccountDto, BanksDto } from '../dtos/wallet.dto';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

export interface InitializeTransactionResponse {
    authorization_url: string;
    access_code: string;
    reference: string;
}

export interface VerifyTransactionResponse {
    status: boolean;
    message: string;
    data?: {
        status: string;
        reference: string;
        amount: number;
        currency: string;
        customer: { email: string };
        metadata?: Record<string, any>;
    };
}

export interface TransferRecipientResponse {
    recipient_code: string;
    type: string;
    name: string;
    account_number: string;
    bank_code: string;
    currency: string;
}

export interface InitiateTransferResponse {
    reference: string;
    transfer_code: string;
    amount: number;
    currency: string;
    status: string;
}

@Injectable()
export class PaystackWalletProvider implements IWalletProvider {
    private readonly logger = new Logger(PaystackWalletProvider.name);
    private readonly paystackSecret: string;
    private readonly baseUrl = 'https://api.paystack.co';

    constructor(
        private readonly config: ConfigService,
    ) {
        this.paystackSecret = this.config.get<string>('payment.paystackSecret');
    }

    private get headers() {
        return {
            Authorization: `Bearer ${this.paystackSecret}`,
            'Content-Type': 'application/json',
        };
    }

    async resolveAccountName(accountNumber: string, bankCode: string, mock: boolean): Promise<AccountDto> {
        if (mock) {
            return {
                accountName: 'John Doe',
                accountNumber: accountNumber,
                bankCode: 'Mock Bank',
            };
        }

        try {
            const response = await axios.get(`${this.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
                headers: this.headers,
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
            this.logger.error('Error resolving account name:', error.response?.data || error.message);
            throw new BadRequestException('Error resolving account name');
        }
    }

    listBanks(): Promise<BanksDto[]> {
        const response = axios.get(`${this.baseUrl}/bank`, {
            headers: this.headers,
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

    async initializeTransaction(
        email: string,
        amount: number,
        reference: string,
        callbackUrl: string,
        metadata?: Record<string, any>,
    ): Promise<InitializeTransactionResponse> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/transaction/initialize`,
                {
                    email,
                    amount,
                    reference,
                    callback_url: callbackUrl,
                    metadata,
                },
                { headers: this.headers },
            );
            if (response.data.status) {
                return response.data.data as InitializeTransactionResponse;
            }
            throw new BadRequestException(response.data.message || 'Failed to initialize transaction');
        } catch (error) {
            this.logger.error('Error initializing transaction:', error.response?.data || error.message);
            if (error instanceof BadRequestException) throw error;
            throw new BadRequestException('Error initializing transaction');
        }
    }

    async verifyTransaction(reference: string): Promise<VerifyTransactionResponse> {
        try {
            const response = await axios.get(`${this.baseUrl}/transaction/verify/${reference}`, {
                headers: this.headers,
            });
            return response.data as VerifyTransactionResponse;
        } catch (error) {
            this.logger.error('Error verifying transaction:', error.response?.data || error.message);
            throw new BadRequestException('Error verifying transaction');
        }
    }

    async createTransferRecipient(
        type: string,
        name: string,
        accountNumber: string,
        bankCode: string,
        currency: string,
    ): Promise<TransferRecipientResponse> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/transferrecipient`,
                {
                    type,
                    name,
                    account_number: accountNumber,
                    bank_code: bankCode,
                    currency,
                },
                { headers: this.headers },
            );
            if (response.data.status) {
                return response.data.data as TransferRecipientResponse;
            }
            throw new BadRequestException(response.data.message || 'Failed to create transfer recipient');
        } catch (error) {
            this.logger.error('Error creating transfer recipient:', error.response?.data || error.message);
            if (error instanceof BadRequestException) throw error;
            throw new BadRequestException('Error creating transfer recipient');
        }
    }

    async initiateTransfer(
        source: string,
        amount: number,
        recipient: string,
        reference: string,
        reason?: string,
    ): Promise<InitiateTransferResponse> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/transfer`,
                {
                    source,
                    amount,
                    recipient,
                    reference,
                    reason: reason || 'Payment for completed job',
                },
                { headers: this.headers },
            );
            if (response.data.status) {
                return response.data.data as InitiateTransferResponse;
            }
            throw new BadRequestException(response.data.message || 'Failed to initiate transfer');
        } catch (error) {
            this.logger.error('Error initiating transfer:', error.response?.data || error.message);
            if (error instanceof BadRequestException) throw error;
            throw new BadRequestException('Error initiating transfer');
        }
    }
}
