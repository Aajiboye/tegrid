import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'shipping-address-id' })
  shippingAddressId: string;
}

export class CheckoutResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  authorizationUrl: string;

  @ApiProperty()
  accessCode: string;

  @ApiProperty()
  reference: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;
}
