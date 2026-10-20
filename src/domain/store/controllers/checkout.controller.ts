import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { user } from 'src/decorators/user.decorator';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { CheckoutService } from '../services/checkout.service';
import { CheckoutDto, CheckoutResponseDto } from '../dtos/checkout.dto';
import { UserType } from 'src/domain/identity/enums/user-types.enum';

@ApiTags('Store Checkout')
@Controller('v1/store/checkout')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  private resolveUserType(currentUser: any): UserType {
    return currentUser.userType || UserType.HomeOwner;
  }

  @Post()
  @ApiBody({ type: CheckoutDto })
  @ApiOperation({ summary: 'Checkout cart and initialize payment' })
  @ApiResponse({ type: CheckoutResponseDto })
  async checkout(@Body() dto: CheckoutDto, @user() currentUser: any) {
    const doc = await this.checkoutService.checkout(
      currentUser._id.toString(),
      this.resolveUserType(currentUser),
      currentUser.email,
      dto,
    );
    return adaptResponse(doc, 'Checkout initialized successfully');
  }

  @Get('delivery-fee')
  @ApiOperation({ summary: 'Get current delivery fee' })
  async getDeliveryFee() {
    const fee = await this.checkoutService.getDeliveryFee();
    return adaptResponse({ deliveryFee: fee }, 'Delivery fee retrieved successfully');
  }
}
