import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;

  /** Demo OTP path for doctors (seed uses 123456) */
  @IsOptional()
  @IsString()
  otp?: string;
}
