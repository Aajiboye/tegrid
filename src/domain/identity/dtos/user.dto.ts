import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserProfileDto {
      @ApiProperty()
      _id: string;
      @ApiPropertyOptional()
      email?: string;
      @ApiPropertyOptional()
      phoneNumber?: string;
      @ApiPropertyOptional()
      userName?: string;
      @ApiPropertyOptional()
      userType?: string;
      @ApiPropertyOptional()
      createdAt?: string;
}

export class UserProfileDtoEnriched extends UserProfileDto {  
      totalWins: number;
      totalGames?: number;
      totalCoins: number;
      winStreak: number;
      leadershipTag?: string;
}

export class UpdateProfileDto{
      @IsString()
      @IsOptional()
      @ApiPropertyOptional({ example: 'john_doe' })
      userName?: string;
      @IsString()
      @IsOptional()
      @ApiPropertyOptional({ example: 'avatar_url' })
      profileAvatar?: string;
}

export class DeleteAccountDto {
      @IsString()
      @IsOptional()
      @ApiPropertyOptional({ description: 'Optional reason for account deletion' })
      reason?: string;
      @IsString() 
      details?: string;
}