import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'abc123-player-id' })
  token: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'ios' })
  platform?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'onesignal' })
  provider?: string;
}

export class MarkNotificationReadDto {
  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ example: true })
  isRead?: boolean;
}

export class NotificationResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  userType: string;

  @ApiProperty({ example: 'JOB_MATCHED' })
  type: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional({ type: Object })
  data?: Record<string, any>;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class DeviceTokenResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  userType: string;

  @ApiProperty()
  token: string;

  @ApiProperty()
  provider: string;

  @ApiPropertyOptional()
  platform?: string;

  @ApiProperty()
  isActive: boolean;
}
