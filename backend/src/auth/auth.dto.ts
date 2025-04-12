import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

/**
 * DTO for user login
 */
export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

/**
 * DTO for creating a new user
 */
export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsString({ message: 'First name must be a string' })
  @IsOptional()
  firstName?: string;

  @IsString({ message: 'Last name must be a string' })
  @IsOptional()
  lastName?: string;
}

/**
 * DTO for the auth response
 */
export class AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
} 