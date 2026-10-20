import { Controller, Get, HttpStatus, HttpCode, Query } from '@nestjs/common';
import { ApiTags,  ApiResponse } from '@nestjs/swagger';
import { adaptResponse } from '../../../shared/adapters/response.adapter';
import { BankList } from '../models/bank-list.model';
import { WalletService } from '../services/wallet.service';
import { AccountDto, ResolveAccountQueryDto } from '../dtos/wallet.dto';

@ApiTags('Banks')
@Controller('v1/banks')
export class BankController {
    constructor(private readonly service: WalletService) { }

    @HttpCode(HttpStatus.OK)
    @Get()
    @ApiResponse({ type: BankList, isArray: true })
    async getBankList(@Query('refresh') refresh: boolean) {
        return adaptResponse(await this.service.listBanks(refresh));
    }

    @HttpCode(HttpStatus.OK)
    @Get('resolve-account')
    @ApiResponse({ type: AccountDto })
    async resolveAccountName(@Query() query: ResolveAccountQueryDto) {
        const result = await this.service.resolveAccountName(
            query.accountNumber,
            query.bankCode,
            false,
        );
        return adaptResponse(result);
    }
}
