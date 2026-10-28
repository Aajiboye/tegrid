import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({ example: '64f8c2e...' })
  recipientId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'HOME_OWNER' })
  recipientType: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Hello, are you available tomorrow?' })
  content: string;
}

export class SendJobMessageDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({ example: '64f8c2e...' })
  recipientId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'TRADESPERSON' })
  recipientType: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'I have sent the verification code.' })
  content: string;
}

export class MarkMessageReadDto {
  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ example: true })
  isRead?: boolean;
}

export class MessageSenderProfileDto {
  @ApiProperty()
  _id: string;

  @ApiPropertyOptional()
  userName?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  profileAvatar?: string;

  @ApiProperty()
  userType: string;
}

export class MessageResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty({ example: 'JOB' })
  type: string;

  @ApiPropertyOptional()
  jobRequest?: string;

  @ApiProperty()
  sender: string;

  @ApiProperty()
  senderType: string;

  @ApiPropertyOptional({ type: MessageSenderProfileDto })
  senderProfile?: MessageSenderProfileDto;

  @ApiProperty()
  recipient: string;

  @ApiProperty()
  recipientType: string;

  @ApiPropertyOptional({ type: MessageSenderProfileDto })
  recipientProfile?: MessageSenderProfileDto;

  @ApiProperty()
  content: string;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
