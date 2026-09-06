import { AccountDto, BanksDto } from "../dtos/wallet.dto";

export interface IWalletProvider {
  resolveAccountName(accountNumber: string, bankCode: string, mock: boolean): Promise<AccountDto>;
  listBanks(): Promise<BanksDto[]>;
}
