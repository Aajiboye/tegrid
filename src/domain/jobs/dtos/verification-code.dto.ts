import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyCodeDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  @ApiProperty({ example: '3847' })
  code: string;
}

export class VerificationCodeResponseDto {
  @ApiProperty({ example: '3847' })
  code: string;

  @ApiProperty({ example: '2026-10-21T12:00:00.000Z' })
  generatedAt: string;
}
