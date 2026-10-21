import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddTrackingUpdateDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'IN_TRANSIT' })
  status: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Package left Lagos warehouse' })
  note?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'DHL' })
  carrier?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'TRK123456789' })
  trackingNumber?: string;
}

export class DeliveryTrackingResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  carrier?: string;

  @ApiPropertyOptional()
  trackingNumber?: string;

  @ApiProperty({ type: Array })
  updates: { status: string; note?: string; at: string }[];

  @ApiPropertyOptional()
  deliveredAt?: string;
}
