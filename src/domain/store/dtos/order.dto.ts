import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../enums/order-status.enum';
import { ProductType } from '../enums/product-type.enum';
import { RentalStatus } from '../enums/rental-status.enum';

export class OrderQueryDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  @ApiPropertyOptional({ enum: OrderStatus })
  status?: OrderStatus;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 1 })
  page?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 20 })
  size?: number;
}

export class ShippingAddressSnapshotDto {
  @ApiPropertyOptional()
  label?: string;

  @ApiProperty()
  recipientName: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  addressLine1: string;

  @ApiPropertyOptional()
  addressLine2?: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  country: string;

  @ApiPropertyOptional()
  postalCode?: string;
}

export class OrderItemResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty({ enum: ProductType })
  type: ProductType;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional()
  rentalStart?: string;

  @ApiPropertyOptional()
  rentalEnd?: string;

  @ApiPropertyOptional()
  rentalDuration?: number;

  @ApiPropertyOptional()
  image?: string;
}

export class OrderResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  deliveryFee: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ type: ShippingAddressSnapshotDto })
  shippingAddress: ShippingAddressSnapshotDto;

  @ApiPropertyOptional()
  paidAt?: string;

  @ApiPropertyOptional()
  deliveredAt?: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiPropertyOptional()
  createdAt?: string;

  @ApiPropertyOptional()
  updatedAt?: string;
}

export class AdminOrderQueryDto extends OrderQueryDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  userType?: string;
}

export class RentalReservationResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  rentalStart: string;

  @ApiProperty()
  rentalEnd: string;

  @ApiProperty({ enum: RentalStatus })
  status: RentalStatus;

  @ApiPropertyOptional()
  returnRequestedAt?: string;

  @ApiPropertyOptional()
  returnConfirmedAt?: string;
}
