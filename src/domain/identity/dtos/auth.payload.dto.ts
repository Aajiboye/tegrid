import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUrl,
} from 'class-validator';
import { Role } from '../enums/roles.enum';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '../enums/user-types.enum';

export class LoginPayload {
  @IsNotEmpty()
  identifier: string;

  @IsString()
  password: string;
}

export class UserSignUpPayLoad {
  @IsString()
  @IsOptional()
  userName?: string;

  @IsUrl()
  @IsOptional()
  profileAvatar?: string;

  @IsNotEmpty()
  identifier: string;

  @IsStrongPassword()
  @IsNotEmpty()
  password: string;
}

export class VendorSignUpPayLoad {
  @IsString()
  businessName: string;

  @IsString()
  productCategory: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsStrongPassword()
  @IsNotEmpty()
  password: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordPayload {
  @IsEmail()
  @IsString()
  email: string;

  @IsStrongPassword()
  @IsString()
  newPassword: string;

  @IsNumberString()
  otp: string;
}

export class VerifyEmailPayload {
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @IsNumberString()
  otp: string;

}

export class VerifyEmailResponse {
  verified: boolean;
}

export class LoginResponse {
  token: string;
  verified: boolean;
  userName: string;
  email: string;
  userRole: Role;
  userType: UserType;
  profileAvatar: string;
  _id: string;
}

export class SignUpResponse {
  userName: string;
  profileAvatar: string;
  verified: boolean;
  email: string;
}

export class RequestEmailOtp {
  @IsString()
  identifier: string;
}

export class UserNameExistenceResponse {
  isTaken: boolean;
}
  
export class FirebaseTokenDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
