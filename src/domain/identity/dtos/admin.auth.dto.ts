import { IsEmail, IsString } from "class-validator";

export class AdminLoginPayload {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}