import {
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUrl,
} from 'class-validator';
import { Role } from '../enums/roles.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '../enums/user-types.enum';
import { JobType } from 'src/domain/jobs/models/job-type.model';

export class LoginPayload {
  @IsNotEmpty()
  @ApiProperty({ example: 'user@example.com or +2348012345678' })
  identifier: string;

  @IsString()
  @ApiProperty({ example: 'Password@123' })
  password: string;
}

export class UserSignUpPayLoad {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'john_doe' })
  userName?: string;

  @IsUrl()
  @IsOptional()
  @ApiPropertyOptional({ example: 'https://.../avatar.jpg' })
  profileAvatar?: string;

  @IsNotEmpty()
  @ApiProperty({ example: 'user@example.com or +2348012345678' })
  identifier: string;

  @IsStrongPassword()
  @IsNotEmpty()
  @ApiProperty({ example: 'Password@123' })
  password: string;


  @IsOptional()
  @IsMongoId({ each: false })
  @ApiPropertyOptional({ example: '64b8f1e2c3d4e5f6a7b8c9d0' })
  mainTradeCategory?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 'Point' })
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };

  @IsString()
  @ApiPropertyOptional({example: "22, Alfred Awen Avn, Ikeja"})
  locationAddress?: String;
}

export class VendorSignUpPayLoad {
  @IsString()
  @ApiProperty({ example: 'ACME Ltd' })
  businessName: string;

  @IsString()
  @ApiProperty({ example: 'Plumbing' })
  productCategory: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'vendor@example.com' })
  email: string;

  @IsStrongPassword()
  @IsNotEmpty()
  @ApiProperty({ example: 'Password@123' })
  password: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'user@example.com' })
  email: string;
}

export class ResetPasswordPayload {
  @IsEmail()
  @IsString()
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @IsStrongPassword()
  @IsString()
  @ApiProperty({ example: 'NewPassword@123' })
  newPassword: string;

  @IsNumberString()
  @ApiProperty({ example: '123456' })
  otp: string;
}

export class VerifyEmailPayload {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'user@example.com or +2348012345678' })
  identifier: string;

  @IsNumberString()
  @ApiProperty({ example: '123456' })
  otp: string;

}

export class VerifyEmailResponse {
  @ApiProperty({ example: true })
  verified: boolean;
}

export class LoginResponse {
  @ApiProperty()
  token: string;

  @ApiProperty()
  verified: boolean;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: Object.values(Role) })
  userRole: Role;

  @ApiProperty({ enum: Object.values(UserType) })
  userType: UserType;

  @ApiPropertyOptional()
  profileAvatar: string;

  @ApiProperty()
  _id: string;
  
  @ApiPropertyOptional()
  mainTradeCategory?: JobType;

  @ApiPropertyOptional()
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export class SignUpResponse {
  @ApiProperty()
  userName: string;
  @ApiPropertyOptional()
  profileAvatar: string;
  @ApiProperty()
  verified: boolean;
  @ApiProperty()
  email: string;
  @ApiPropertyOptional()
  phoneNumber?: string;
  @ApiPropertyOptional()
  locationAddress?: string;
}

export class RequestEmailOtp {
  @IsString()
  @ApiProperty({ example: 'user@example.com or +2348012345678' })
  identifier: string;
}

export class UserNameExistenceResponse {
  @ApiProperty({ example: false })
  isTaken: boolean;
}

export class FirebaseTokenDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Firebase ID token' })
  idToken: string;
}
