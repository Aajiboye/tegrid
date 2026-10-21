import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class PayUpfrontResponseDto {
  @ApiProperty({ example: 'https://checkout.paystack.com/abc123' })
  authorizationUrl: string;

  @ApiProperty({ example: 'abc123' })
  accessCode: string;

  @ApiProperty({ example: 'PAY-123456789' })
  reference: string;

  @ApiProperty({ example: 1050000 })
  amount: number;

  @ApiProperty({ example: 'NGN' })
  currency: string;
}

export class PaymentResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  quotation: string;

  @ApiProperty()
  jobRequest: string;

  @ApiProperty()
  homeOwner: string;

  @ApiProperty()
  tradePerson: string;

  @ApiProperty({ example: 1050000 })
  amount: number;

  @ApiProperty({ example: 'NGN' })
  currency: string;

  @ApiProperty({ example: 'SUCCESS' })
  status: string;

  @ApiProperty()
  paystackReference: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class ReleasePaymentDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'INITIAL', description: 'INITIAL or BALANCE' })
  releaseType: 'INITIAL' | 'BALANCE';

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Initial milestone completed' })
  reason?: string;
}

export class ReleaseResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  payment: string;

  @ApiProperty()
  quotation: string;

  @ApiProperty()
  jobRequest: string;

  @ApiProperty()
  tradePerson: string;

  @ApiProperty({ example: 'INITIAL' })
  releaseType: string;

  @ApiProperty({ example: 500000 })
  amount: number;

  @ApiProperty({ example: 'NGN' })
  currency: string;

  @ApiProperty({ example: 'SUCCESS' })
  status: string;

  @ApiPropertyOptional()
  paystackTransferReference?: string;

  @ApiPropertyOptional()
  releasedBy?: string;

  @ApiPropertyOptional()
  reason?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class PaystackWebhookDto {
  event: string;
  data: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    customer: { email: string };
    metadata?: Record<string, any>;
  };
}
