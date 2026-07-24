import { IsString } from "class-validator";

export class UserProfileDto {
      _id: string;
      rank: string;
      userName: string;
      email: string;
      currentLevel: string;
      online: boolean;
      profileAvatar?: string;
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
    userName: string;
    @IsString()
    profileAvatar?: string;
}

export class DeleteAccountDto {
  @IsString()
  reason: string;
  @IsString() 
  details?: string;
}